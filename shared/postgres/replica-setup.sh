#!/bin/bash
set -e

# Menunggu database primary siap
until pg_isready -h tetris-postgres-primary -p 5432 -U tetris_user; do
  echo "Menunggu postgres primary siap..."
  sleep 2
done

# Jika folder data masih kosong, lakukan pg_basebackup
if [ -z "$(ls -A "$PGDATA")" ]; then
  echo "Memulai replikasi basis data dari primary..."
  PGPASSWORD=tetris_password123 pg_basebackup -h tetris-postgres-primary -D "$PGDATA" -U replicator -Fp -Xs -P -R
  echo "Replikasi selesai dibuat secara lokal."
fi