from typing import Any, Dict, Optional

def success_response(data: Any, message: str = "Success") -> Dict[str, Any]:
    return {
        "status": "success",
        "message": message,
        "data": data
    }

def error_response(message: str, error_code: str = "BAD_REQUEST", details: Optional[Any] = None) -> Dict[str, Any]:
    return {
        "status": "error",
        "error_code": error_code,
        "message": message,
        "details": details
    }
