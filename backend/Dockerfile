FROM python:3.12-slim

WORKDIR /app

# System deps for mysqlclient-style builds (pymysql is pure-python, but
# cryptography needs these to build/install cleanly on slim images)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# Shell form (not exec/array form) so $PORT actually gets expanded — Railway
# assigns a dynamic port at runtime via this env var; Docker Compose doesn't
# set it, so the ${PORT:-8000} fallback keeps local `docker compose up`
# working unchanged on port 8000.
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
