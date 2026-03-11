from fastapi import APIRouter, Depends, Query, HTTPException
from app.schemas.media import MediaListResponse
from app.core.dependencies import require_admin
from app.services.r2 import s3, R2_BUCKET, generate_presigned_download_url

router = APIRouter(prefix="/admin/media", tags=["Media Repository"])


def list_media_objects(
    prefix: str = "",
    search: str | None = None,
    continuation_token: str | None = None,
    limit: int = 50,
):
    params = {
        "Bucket": R2_BUCKET,
        "Prefix": prefix,
        "Delimiter": "/",
        "MaxKeys": limit,
    }
    if continuation_token:
        params["ContinuationToken"] = continuation_token

    response = s3.list_objects_v2(**params)

    folders = []
    files = []

    if "CommonPrefixes" in response:
        for folder in response["CommonPrefixes"]:
            folders.append(folder["Prefix"])

    if "Contents" in response:
        for obj in response["Contents"]:
            key = obj["Key"]
            if key == prefix:
                continue
            if key.endswith("/"):
                continue
            if search and search.lower() not in key.lower():
                continue
            files.append({
                "key": key,
                "size": obj["Size"],
                "last_modified": obj["LastModified"],
                "download_url": generate_presigned_download_url(key),
            })

    return {
        "current_prefix": prefix,
        "folders": folders,
        "files": files,
        "next_token": response.get("NextContinuationToken"),
    }


@router.get("", response_model=MediaListResponse)
def list_media(
    prefix: str = Query("", description="Folder prefix"),
    search: str = Query("", description="Filter by worker ID or path"),
    continuation_token: str | None = Query(None),
    user=Depends(require_admin),
):
    return list_media_objects(
        prefix=prefix,
        search=search or None,
        continuation_token=continuation_token or None,
    )


@router.delete("")
def delete_media_file(key: str, user=Depends(require_admin)):
    try:
        s3.delete_object(Bucket=R2_BUCKET, Key=key)
        return {"message": "File deleted successfully"}
    except Exception:
        raise HTTPException(500, "Delete failed")