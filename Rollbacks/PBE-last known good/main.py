from fastapi import FastAPI
from pydantic import BaseModel
import asyncio
from scanner import scan_target
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="Project BLACKOUT Engine")

class ScanRequest(BaseModel):
    clientId: str
    full_name: str
    past_city: str

class StopRequest(BaseModel):
    clientId: str

@app.post("/start-scan")
async def start_scan(request: ScanRequest):
    """
    Triggered by Vercel when invoice.paid webhook fires.
    Runs the scanner and writes results to Supabase.
    """
    print(f"[+] Scan triggered for client: {request.clientId}")
    
    try:
        results = await scan_target(
            client_id=request.clientId,
            full_name=request.full_name,
            past_city=request.past_city
        )
        
        return {
            "status": "success",
            "targets_found": len(results),
            "message": f"Scan completed for client {request.clientId}"
        }
    except Exception as e:
        print(f"[!] Scan failed: {e}")
        return {
            "status": "error",
            "message": str(e)
        }

@app.post("/stop-scan")
async def stop_scan(request: StopRequest):
    """
    Triggered by Vercel when invoice.payment_failed webhook fires.
    Stops monitoring for this client.
    """
    print(f"[!] Scan stopped for client: {request.clientId}")
    # In production: remove client from active queue in Supabase
    return {
        "status": "success",
        "message": f"Monitoring stopped for client {request.clientId}"
    }

@app.get("/")
def health_check():
    return {"status": "Project BLACKOUT Engine is online."}

@app.get("/test-scan")
async def test_scan():
    """
    Manual test endpoint for debugging.
    Visit: http://localhost:8000/test-scan
    """
    test_client_id = "00000000-0000-0000-0000-000000000000"
    results = await scan_target(test_client_id, "John Smith", "Toronto ON")
    return {"targets_found": len(results), "data": results}