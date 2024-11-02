# api/webhook.py

def handler(event, context):
    # Basic response format expected by Vercel
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "text/plain"
        },
        "body": "Hello, world!"
    }
