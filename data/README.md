# Data Directory

This directory contains static data files used by the application.

## dictionary.json

Spanish dictionary for word validation in Boggle game.
- Source: an-array-of-spanish-words npm package
- Size: ~7.9MB
- Format: JSON array of Spanish words
- Usage: Loaded into server memory on startup for O(1) word lookup

**Do not modify this file manually.**
