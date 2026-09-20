import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;
const measurements = [];
const devices = new Map();

app.get("/api/health", (req,res) =>
  res.json({status:"ok", service:"stroke-iot-api"})
);

app.post("/api/devices/heartbeat", (req,res) => {
  const {device_id} = req.body;
  if (!device_id) return res.status(400).json({error:"device_id wajib"});
  devices.set(device_id, {device_id, last_seen:new Date().toISOString()});
  res.json({ok:true});
});

app.post("/api/measurements", (req,res) => {
  const {patient_id,session_id,device_id,heart_rate,spo2,temperature}=req.body;
  if (!patient_id || !session_id || !device_id)
    return res.status(400).json({error:"patient_id, session_id, device_id wajib"});
  const old = measurements.filter(x=>x.session_id===session_id);
  if (old.length>=20)
    return res.status(409).json({error:"Sesi sudah 20 pengukuran"});
  const record = {
    measurement_no:old.length+1, patient_id, session_id, device_id,
    heart_rate, spo2, temperature, measured_at:new Date().toISOString()
  };
  measurements.push(record);
  devices.set(device_id,{device_id,last_seen:record.measured_at});
  res.status(201).json({ok:true,measurement:record});
});

app.get("/api/sessions/:session_id/measurements",(req,res)=>{
  const data=measurements.filter(x=>x.session_id===req.params.session_id);
  res.json({count:data.length,data});
});

app.listen(PORT,"0.0.0.0",()=>console.log(`API running on ${PORT}`));
