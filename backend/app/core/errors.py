from typing import Any

from fastapi import HTTPException, status


def api_error(
    status_code: int,
    code: str,
    message: str,
    fields: dict[str, str] | None = None,
) -> HTTPException:
    detail: dict[str, Any] = {"code": code, "message": message}
    if fields:
        detail["fields"] = fields
    return HTTPException(status_code=status_code, detail=detail)


def forbidden(message: str = "You are not authorized to perform this action") -> HTTPException:
    return api_error(status.HTTP_403_FORBIDDEN, "forbidden", message)


def not_found(resource: str) -> HTTPException:
    return api_error(status.HTTP_404_NOT_FOUND, "not_found", f"{resource} was not found")
