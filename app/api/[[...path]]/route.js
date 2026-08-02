import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import twilio from 'twilio';

const uri = process.env.MONGO_URL;
const dbName = process.env.DB_NAME || 'latetrack_ai';

// Demo student data (10 realistic Indian names across departments)
const DEMO_STUDENTS = [
  { fullName: 'Aditi Sharma',   rollNumber: 'CSE21B045', department: 'CSE',    year: '3', parentEmail: 'sharma.family@example.com', parentMobile: '+919876543210' },
  { fullName: 'Rohan Verma',    rollNumber: 'CSE21B046', department: 'CSE',    year: '3', parentEmail: 'verma@example.com',          parentMobile: '+919876543211' },
  { fullName: 'Sneha Iyer',     rollNumber: 'ECE22A012', department: 'ECE',    year: '2', parentEmail: 'iyer@example.com',           parentMobile: '+919876543212' },
  { fullName: 'Karan Malhotra', rollNumber: 'ECE22A013', department: 'ECE',    year: '2', parentEmail: 'malhotra@example.com',       parentMobile: '+919876543213' },
  { fullName: 'Priya Nair',     rollNumber: 'EEE21C077', department: 'EEE',    year: '3', parentEmail: 'nair@example.com',           parentMobile: '+919876543214' },
  { fullName: 'Arjun Reddy',    rollNumber: 'MECH20D030', department: 'MECH',  year: '4', parentEmail: 'reddy@example.com',          parentMobile: '+919876543215' },
  { fullName: 'Nikhil Patel',   rollNumber: 'MECH23D091', department: 'MECH',  year: '1', parentEmail: 'patel@example.com',          parentMobile: '+919876543216' },
  { fullName: 'Isha Kapoor',    rollNumber: 'IT22E055',   department: 'IT',    year: '2', parentEmail: 'kapoor@example.com',         parentMobile: '+919876543217' },
  { fullName: 'Vikram Singh',   rollNumber: 'IT22E056',   department: 'IT',    year: '2', parentEmail: 'singh@example.com',          parentMobile: '+919876543218' },
  { fullName: 'Ananya Ghosh',   rollNumber: 'AIDS23F009', department: 'AIDS',  year: '1', parentEmail: 'ghosh@example.com',          parentMobile: '+919876543219' },
  { fullName: 'Rahul Menon',    rollNumber: 'CIVIL21G044',department: 'CIVIL', year: '3', parentEmail: 'menon@example.com',          parentMobile: '+919876543220' },
  { fullName: 'Divya Rao',      rollNumber: 'CSE22B120',  department: 'CSE',   year: '2', parentEmail: 'rao@example.com',            parentMobile: '+919876543221' },
];

function randomDescriptor() {
  // 128-D unit-ish vector (random, not real face — for demo analytics only)
  const arr = Array.from({ length: 128 }, () => (Math.random() - 0.5) * 0.5);
  return arr;
}

function tinyAvatar(initial, hue) {
  // Tiny SVG data URI avatar
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><rect width='160' height='160' fill='hsl(${hue},60%,25%)'/><text x='50%' y='55%' font-size='72' text-anchor='middle' fill='hsl(${hue},80%,80%)' font-family='sans-serif' font-weight='700'>${initial}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

let cachedClient = null;
async function getDb() {
  if (!cachedClient) {
    cachedClient = new MongoClient(uri);
    await cachedClient.connect();
  }
  return cachedClient.db(dbName);
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data, status = 200) {
  return NextResponse.json(data, { status, headers: CORS });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

// Route dispatcher
async function handle(request, { params }) {
  const method = request.method;
  const resolvedParams = await params;
  const path = (resolvedParams?.path || []).join('/');
  const url = new URL(request.url);

  try {
    const db = await getDb();
    const students = db.collection('students');
    const logs = db.collection('attendance_logs');

    // ---- STUDENTS ----
    if (path === 'students') {
      if (method === 'GET') {
        const q = url.searchParams.get('q') || '';
        const dept = url.searchParams.get('department') || '';
        const year = url.searchParams.get('year') || '';
        const filter = {};
        if (dept) filter.department = dept;
        if (year) filter.year = year;
        if (q) {
          filter.$or = [
            { fullName: { $regex: q, $options: 'i' } },
            { rollNumber: { $regex: q, $options: 'i' } },
          ];
        }
        const list = await students.find(filter, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray();
        // Attach late stats
        const withStats = await Promise.all(list.map(async (s) => {
          const lateCount = await logs.countDocuments({ studentId: s.id, status: 'LATE' });
          const totalCount = await logs.countDocuments({ studentId: s.id });
          return { ...s, lateCount, totalCount };
        }));
        return json({ students: withStats });
      }
      if (method === 'POST') {
        const body = await request.json();
        if (!body.rollNumber || !body.fullName || !body.faceDescriptor) {
          return json({ error: 'Missing required fields' }, 400);
        }
        const exists = await students.findOne({ rollNumber: body.rollNumber });
        if (exists) return json({ error: 'Roll number already registered' }, 409);
        const student = {
          id: uuidv4(),
          rollNumber: body.rollNumber,
          fullName: body.fullName,
          department: body.department || 'CSE',
          year: body.year || '1',
          parentEmail: body.parentEmail || '',
          parentMobile: body.parentMobile || '',
          faceDescriptor: body.faceDescriptor, // array of 128 floats
          photoUrl: body.photoUrl || '',
          createdAt: new Date().toISOString(),
        };
        await students.insertOne(student);
        const { _id, ...clean } = student;
        return json({ student: clean }, 201);
      }
    }

    if (path.startsWith('students/')) {
      const id = path.split('/')[1];
      if (method === 'GET') {
        const s = await students.findOne({ id }, { projection: { _id: 0 } });
        if (!s) return json({ error: 'Not found' }, 404);
        const history = await logs.find({ studentId: id }, { projection: { _id: 0 } }).sort({ timestamp: -1 }).toArray();
        return json({ student: s, history });
      }
      if (method === 'DELETE') {
        await students.deleteOne({ id });
        await logs.deleteMany({ studentId: id });
        return json({ ok: true });
      }
    }

    // ---- ATTENDANCE ----
    if (path === 'attendance') {
      if (method === 'POST') {
        const body = await request.json();
        // body: { studentId, arrivalTime (ISO), cutoffMinutes (default 540 = 9:00), capturedImage }
        if (!body.studentId) return json({ error: 'studentId required' }, 400);
        const student = await students.findOne({ id: body.studentId }, { projection: { _id: 0 } });
        if (!student) return json({ error: 'Student not found' }, 404);

        const arrival = body.arrivalTime ? new Date(body.arrivalTime) : new Date();
        const cutoffMinutes = typeof body.cutoffMinutes === 'number' ? body.cutoffMinutes : 540; // 09:00
        const minutesOfDay = arrival.getHours() * 60 + arrival.getMinutes();
        const lateDurationMinutes = Math.max(0, minutesOfDay - cutoffMinutes);
        const status = lateDurationMinutes > 0 ? 'LATE' : 'ON_TIME';

        // Check if student already logged for today
        const startOfDay = new Date(arrival);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(arrival);
        endOfDay.setHours(23, 59, 59, 999);
        const existing = await logs.findOne({
          studentId: body.studentId,
          timestamp: { $gte: startOfDay.toISOString(), $lte: endOfDay.toISOString() },
        });
        if (existing) {
          const { _id, ...cleanLog } = existing;
          return json({ log: cleanLog, student, duplicate: true });
        }

        const log = {
          id: uuidv4(),
          studentId: body.studentId,
          timestamp: arrival.toISOString(),
          arrivalTime: arrival.toISOString(),
          lateDurationMinutes,
          status,
          capturedImage: body.capturedImage || '',
        };
        await logs.insertOne(log);
        const { _id, ...clean } = log;
        return json({ log: clean, student });
      }
      if (method === 'GET') {
        const status = url.searchParams.get('status');
        const dept = url.searchParams.get('department');
        const filter = {};
        if (status) filter.status = status;
        const items = await logs.find(filter, { projection: { _id: 0 } }).sort({ timestamp: -1 }).limit(500).toArray();
        // Join with students
        const studentIds = [...new Set(items.map((i) => i.studentId))];
        const studs = await students.find({ id: { $in: studentIds } }, { projection: { _id: 0 } }).toArray();
        const map = Object.fromEntries(studs.map((s) => [s.id, s]));
        let joined = items.map((l) => ({ ...l, student: map[l.studentId] || null }));
        if (dept) joined = joined.filter((l) => l.student?.department === dept);
        return json({ logs: joined });
      }
    }

    // ---- STATS ----
    if (path === 'stats') {
      const now = new Date();
      const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now); endOfDay.setHours(23, 59, 59, 999);
      const totalStudents = await students.countDocuments({});
      const todayLogs = await logs.find({
        timestamp: { $gte: startOfDay.toISOString(), $lte: endOfDay.toISOString() }
      }, { projection: { _id: 0 } }).toArray();
      const todayLate = todayLogs.filter((l) => l.status === 'LATE').length;
      const todayOnTime = todayLogs.filter((l) => l.status === 'ON_TIME').length;

      // Peak arrival hour
      const hourCounts = {};
      todayLogs.forEach((l) => {
        const h = new Date(l.timestamp).getHours();
        hourCounts[h] = (hourCounts[h] || 0) + 1;
      });
      const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
      const peakArrivalTime = peakHour ? `${String(peakHour[0]).padStart(2, '0')}:00` : '--:--';

      // Repeat offenders (>=3 late)
      const pipeline = [
        { $match: { status: 'LATE' } },
        { $group: { _id: '$studentId', count: { $sum: 1 } } },
        { $match: { count: { $gte: 3 } } },
      ];
      const offenders = await logs.aggregate(pipeline).toArray();

      return json({
        totalStudents,
        todayLate,
        todayOnTime,
        peakArrivalTime,
        repeatOffenders: offenders.length,
      });
    }

    // ---- ANALYTICS ----
    if (path === 'analytics') {
      // Last 7 days trend
      const days = [];
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const end = new Date(d);
        end.setHours(23, 59, 59, 999);
        const dayLogs = await logs.find({
          timestamp: { $gte: d.toISOString(), $lte: end.toISOString() },
        }, { projection: { _id: 0 } }).toArray();
        days.push({
          date: d.toISOString().slice(5, 10),
          late: dayLogs.filter((l) => l.status === 'LATE').length,
          onTime: dayLogs.filter((l) => l.status === 'ON_TIME').length,
        });
      }

      // By department
      const allLogs = await logs.find({ status: 'LATE' }, { projection: { _id: 0 } }).toArray();
      const allStudents = await students.find({}, { projection: { _id: 0 } }).toArray();
      const studMap = Object.fromEntries(allStudents.map((s) => [s.id, s]));
      const byDept = {};
      allLogs.forEach((l) => {
        const s = studMap[l.studentId];
        if (s) byDept[s.department] = (byDept[s.department] || 0) + 1;
      });
      const departmentData = Object.entries(byDept).map(([name, value]) => ({ name, value }));

      // Top repeat late offenders
      const offenderCounts = {};
      allLogs.forEach((l) => {
        offenderCounts[l.studentId] = (offenderCounts[l.studentId] || 0) + 1;
      });
      const topOffenders = Object.entries(offenderCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([sid, count]) => ({ student: studMap[sid], lateCount: count }))
        .filter((o) => o.student);

      return json({ dailyTrend: days, departmentData, topOffenders });
    }

    // ---- SEED (demo data populate) ----
    if (path === 'seed') {
      if (method === 'POST') {
        // Wipe existing
        await students.deleteMany({});
        await logs.deleteMany({});
        const now = new Date();
        const insertedStudents = [];
        for (let i = 0; i < DEMO_STUDENTS.length; i++) {
          const d = DEMO_STUDENTS[i];
          const s = {
            id: uuidv4(),
            ...d,
            faceDescriptor: randomDescriptor(),
            photoUrl: tinyAvatar(d.fullName[0], (i * 47) % 360),
            createdAt: new Date(now.getTime() - i * 86400000).toISOString(),
          };
          await students.insertOne(s);
          insertedStudents.push(s);
        }
        // Create attendance logs across last 7 days (mix of LATE and ON_TIME)
        const insertedLogs = [];
        for (let d = 6; d >= 0; d--) {
          const day = new Date(now);
          day.setDate(day.getDate() - d);
          // Some students each day; certain ones are repeat offenders
          const repeatOffenderIdxs = [0, 3, 6]; // Aditi, Karan, Nikhil
          const dailyPool = [...insertedStudents.keys()].sort(() => Math.random() - 0.5).slice(0, 8);
          const attendees = [...new Set([...dailyPool, ...repeatOffenderIdxs])];
          for (const idx of attendees) {
            const stu = insertedStudents[idx];
            // Bias repeat offenders to be late
            const isRepeat = repeatOffenderIdxs.includes(idx);
            const isLate = isRepeat ? Math.random() < 0.85 : Math.random() < 0.35;
            const hour = isLate ? 9 : 8;
            const minute = isLate ? Math.floor(Math.random() * 45) + 5 : Math.floor(Math.random() * 55);
            const arrival = new Date(day);
            arrival.setHours(hour, minute, Math.floor(Math.random() * 60), 0);
            const minutesOfDay = arrival.getHours() * 60 + arrival.getMinutes();
            const lateDurationMinutes = Math.max(0, minutesOfDay - 540);
            const log = {
              id: uuidv4(),
              studentId: stu.id,
              timestamp: arrival.toISOString(),
              arrivalTime: arrival.toISOString(),
              lateDurationMinutes,
              status: lateDurationMinutes > 0 ? 'LATE' : 'ON_TIME',
              capturedImage: '',
            };
            await logs.insertOne(log);
            insertedLogs.push(log);
          }
        }
        return json({ ok: true, students: insertedStudents.length, logs: insertedLogs.length });
      }
      if (method === 'DELETE') {
        const s = await students.deleteMany({});
        const l = await logs.deleteMany({});
        return json({ ok: true, studentsRemoved: s.deletedCount, logsRemoved: l.deletedCount });
      }
    }

    // ---- NOTIFICATIONS (Twilio SMS / WhatsApp) ----
    if (path === 'notifications') {
      if (method === 'POST') {
        const body = await request.json();
        const { to, message, channel = 'sms', studentId } = body || {};
        if (!to || !message) return json({ error: 'to and message required' }, 400);

        const sid = process.env.TWILIO_ACCOUNT_SID;
        const token = process.env.TWILIO_AUTH_TOKEN;
        const smsFrom = process.env.TWILIO_SMS_FROM;
        const waFrom = process.env.TWILIO_WHATSAPP_FROM;
        if (!sid || !token) {
          return json({ error: 'Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env' }, 501);
        }
        try {
          const client = twilio(sid, token);
          const from = channel === 'whatsapp' ? waFrom : smsFrom;
          if (!from) return json({ error: `Missing ${channel === 'whatsapp' ? 'TWILIO_WHATSAPP_FROM' : 'TWILIO_SMS_FROM'}` }, 501);
          const dest = channel === 'whatsapp' ? `whatsapp:${to}` : to;
          const msg = await client.messages.create({ from, to: dest, body: message });
          // Audit log
          await db.collection('notifications').insertOne({
            id: uuidv4(),
            twilioSid: msg.sid,
            to,
            channel,
            body: message,
            studentId: studentId || null,
            status: msg.status,
            createdAt: new Date().toISOString(),
          });
          return json({ ok: true, sid: msg.sid, status: msg.status });
        } catch (e) {
          console.error('Twilio error:', e);
          return json({ error: e.message || 'Twilio send failed', code: e.code }, 502);
        }
      }
    }

    return json({ error: 'Not found', path }, 404);
  } catch (err) {
    console.error('API error:', err);
    return json({ error: err.message || 'Server error' }, 500);
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
