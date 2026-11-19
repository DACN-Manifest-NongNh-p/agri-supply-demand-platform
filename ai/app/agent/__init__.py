"""Gemini agent: answers from retrieved policy only, and drives the page through tools.

Planned modules:
- prompts.py   system prompt (answer from context, cite sources, say when it does not know)
- tools.py     search_policy, get_rules (live values from the Spring API), page actions
- loop.py      tool-calling loop with a step limit
"""
