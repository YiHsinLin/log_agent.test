#!/bin/bash
severities=("emerg" "alert" "crit" "err" "warning" "notice" "info" "debug")
for i in {1..1000}
do
    node client.js --port 5140 --message "Hii $i, this is MARS speaking" --severity ${severities[$RANDOM % ${#severities[@]} ]}
done