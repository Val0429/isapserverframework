#!/bin/bash
# Program:
#   This program were install ADVANTECH server
# History:
#   2020/01/01 - Morris.Hsu
#   2020/10/08 - Morris.Hsu

service cron stop
PIDS=$(ps -xa | awk '{print  $  1 }' | grep -E '[0-9]')
kill -9 ${PIDS}
