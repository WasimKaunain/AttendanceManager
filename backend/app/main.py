from fastapi import FastAPI
from app.api import auth, projects, sites, workers, attendance, shifts, dashboard, audit_logs, geocode, users, mobile, reports
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI(title="Attendance Manager API")

app.add_middleware(
    CORSMiddleware,
     allow_origins=["*"
    #     "http://localhost:5173",
    #     "http://127.0.0.1:5173",
    #     "https://attendance-manager-vert.vercel.app""
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(sites.router)
app.include_router(workers.router)  
app.include_router(attendance.router)
app.include_router(shifts.router)
app.include_router(dashboard.router)
app.include_router(audit_logs.router)
app.include_router(geocode.router)  
app.include_router(users.router)  
app.include_router(mobile.router)
app.include_router(reports.router)

@app.get("/")
def health():
    return {"status": "ok"}
