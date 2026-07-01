"""
Helper functions for the KASI Portfolio
"""

from datetime import datetime
from typing import Optional


def format_date(date_string: str) -> str:
    """Format a date string for display"""
    if not date_string:
        return "Unknown date"
    
    try:
        date = datetime.fromisoformat(date_string.replace('Z', '+00:00'))
        return date.strftime("%B %d, %Y at %I:%M %p")
    except:
        return date_string


def format_relative_time(date_string: str) -> str:
    """Format a date as relative time (e.g., '2 hours ago')"""
    if not date_string:
        return "Unknown time"
    
    try:
        date = datetime.fromisoformat(date_string.replace('Z', '+00:00'))
        now = datetime.utcnow()
        diff = now - date
        
        seconds = diff.total_seconds()
        
        if seconds < 60:
            return "Just now"
        elif seconds < 3600:
            minutes = int(seconds / 60)
            return f"{minutes}m ago"
        elif seconds < 86400:
            hours = int(seconds / 3600)
            return f"{hours}h ago"
        elif seconds < 604800:
            days = int(seconds / 86400)
            return f"{days}d ago"
        else:
            return format_date(date_string)
    except:
        return date_string


def truncate_text(text: str, max_length: int = 100) -> str:
    """Truncate text with ellipsis"""
    if not text:
        return ""
    if len(text) <= max_length:
        return text
    return text[:max_length] + "..."
