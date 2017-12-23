#!/bin/bash
DIRPATH="$(pwd)"

if [ $# -eq 0 ]; then
    echo "Please provide a domain as the 1st argument"
    return 0
fi;

if [ -z "$1" ]; then
    echo "Please provide a domain as the 1st argument"
    return 0
fi;

if [ $# -eq 1 ]; then
    echo "Please provide an email as the 2nd argument"
    return 0
fi;

if [ -z "$2" ]; then
    echo "Please provide an email as the 2nd argument"
    return 0
fi;

sudo certbot certonly --webroot --webroot-path ${DIRPATH}/www/ --renew-by-default --email ${2} --text --agree-tos -d ${1}