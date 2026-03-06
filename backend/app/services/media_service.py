from app.services.r2 import s3
from app.services.r2 import R2_BUCKET

def list_media_objects(prefix: str = ""):
    response = s3.list_objects_v2(
        Bucket=R2_BUCKET,
        Prefix=prefix,
        Delimiter="/"
    )

    folders = []
    files = []

    # Extract folders
    if "CommonPrefixes" in response:
        for folder in response["CommonPrefixes"]:
            folders.append(folder["Prefix"])

    # Extract files
    if "Contents" in response:
        for obj in response["Contents"]:
            if obj["Key"] != prefix:  # skip current folder itself
                files.append({
                    "key": obj["Key"],
                    "size": obj["Size"],
                    "last_modified": obj["LastModified"]
                })

    return {
        "current_prefix": prefix,
        "folders": folders,
        "files": files
    }