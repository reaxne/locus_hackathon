"""Test an existing LocusBackend checkout against an isolated local PostgreSQL cluster."""
import argparse
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import time
import urllib.request

parser = argparse.ArgumentParser()
parser.add_argument('--backend', type=Path, required=True)
parser.add_argument('--browser', action='store_true')
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
backend = args.backend.resolve()
pg = Path(os.environ.get('PG_BIN', 'C:/Program Files/PostgreSQL/18/bin'))
(root / 'tmp').mkdir(exist_ok=True)
data = Path(tempfile.mkdtemp(prefix='locus-pg-', dir=root / 'tmp'))
env = {**os.environ, 'DATABASE_URL':'postgresql://locus_test@127.0.0.1:54329/postgres',
       'TEST_DATABASE_URL':'postgresql://locus_test@127.0.0.1:54329/postgres', 'COOKIE_SECURE':'false'}
started = False
api = None
try:
    subprocess.run([str(pg/'initdb'),'-D',str(data),'-U','locus_test','--auth=trust','--encoding=UTF8','--no-locale'], check=True, stdout=subprocess.DEVNULL)
    subprocess.run([str(pg/'pg_ctl'),'-D',str(data),'-l',str(data/'server.log'),'-o','-h 127.0.0.1 -p 54329','-w','start'], check=True)
    started = True
    result = subprocess.run([sys.executable,'-m','pytest','-q'],cwd=backend,env=env)
    if result.returncode == 0 and args.browser:
        port = os.environ.get('PLAYWRIGHT_PORT', '3100')
        env['ALLOWED_ORIGINS'] = '["http://127.0.0.1:3100","http://127.0.0.1:' + port + '"]'
        api = subprocess.Popen([sys.executable,'-m','uvicorn','main:app','--host','127.0.0.1','--port','8001'],cwd=backend,env=env)
        for _ in range(50):
            try:
                urllib.request.urlopen('http://127.0.0.1:8001/health',timeout=1)
                break
            except OSError:
                time.sleep(.2)
        else:
            raise RuntimeError('Backend did not start')
        result = subprocess.run(['npm.cmd' if os.name=='nt' else 'npm','run','test:e2e'],cwd=root,env=env)
    sys.exit(result.returncode)
finally:
    if api:
        api.terminate()
        api.wait(timeout=15)
    if started:
        subprocess.run([str(pg/'pg_ctl'),'-D',str(data),'-m','fast','-w','stop'], check=True)
