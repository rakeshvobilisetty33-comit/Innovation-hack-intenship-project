#!/usr/bin/env bash
# Resilient production server supervisor with polling restart.
cd /home/z/my-project/.next/standalone
export PORT=3000
export NODE_OPTIONS="--max-old-space-size=256"

start_server() {
  nohup node server.js >> /home/z/my-project/dev.log 2>&1 &
  echo $!
}

while true; do
  PID=$(start_server)
  echo "[sup $(date +%H:%M:%S)] started server pid $PID"
  # Poll until the process dies.
  while kill -0 $PID 2>/dev/null; do
    sleep 2
  done
  echo "[sup $(date +%H:%M:%S)] server $PID died, restarting in 3s..."
  sleep 3
done
