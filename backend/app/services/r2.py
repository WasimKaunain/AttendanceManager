import boto3
import os
from botocore.client import Config

R2_ENDPOINT = os.getenv("R2_ENDPOINT")
R2_ACCESS_KEY = os.getenv("R2_ACCESS_KEY")
R2_SECRET_KEY = os.getenv("R2_SECRET_KEY")
R2_BUCKET = os.getenv("R2_BUCKET")

s3 = boto3.client(
    "s3",
    endpoint_url=R2_ENDPOINT,
    aws_access_key_id=R2_ACCESS_KEY,
    aws_secret_access_key=R2_SECRET_KEY,
    config=Config(signature_version="s3v4"),
)

def upload_file_to_r2(file_bytes: bytes, object_key: str, content_type: str):
    s3.put_object(
        Bucket=R2_BUCKET,
        Key=object_key,
        Body=file_bytes,
        ContentType=content_type,
    )

    return object_key  # store only key in DB

def generate_presigned_upload_url(object_key: str, content_type: str):
    return s3.generate_presigned_url(
        ClientMethod="put_object",
        Params={
            "Bucket": R2_BUCKET,
            "Key": object_key,
            "ContentType": content_type,
        },
        ExpiresIn=300,  # 5 minutes
    )

def generate_presigned_download_url(object_key: str):
    return s3.generate_presigned_url(
        ClientMethod="get_object",
        Params={
            "Bucket": R2_BUCKET,
            "Key": object_key,
        },
        ExpiresIn=300,
    )