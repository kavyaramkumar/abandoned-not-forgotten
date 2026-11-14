# Ask Echo AI server (see README.md). Build from the server/ folder:
#   docker build -t ask-echo . && docker run -p 8787:8787 -e ANTHROPIC_API_KEY=... ask-echo
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    HOST=0.0.0.0 \
    PORT=8787 \
    TRUST_PROXY=1

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# only the server's own files: never .env or .venv
COPY ask_server.py retrieval.py knowledge.json ./

RUN useradd --create-home echo
USER echo

EXPOSE 8787
CMD ["python", "ask_server.py"]
