#!/bin/bash
# anything-to-md skill wrapper for OpenClaw
# Usage: a2md_skill.sh <subcommand> [args...]
# Subcommands: file, dir, youtube, formats

source ~/anything-to-md/venv/bin/activate
exec anything-to-md "$@"
