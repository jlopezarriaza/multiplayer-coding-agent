import json
import os
import datetime

SCORES_FILE = "scores.json"

def _load_scores():
    if not os.path.exists(SCORES_FILE):
        return []
    with open(SCORES_FILE, "r") as f:
        return json.load(f)

def _save_scores(scores):
    with open(SCORES_FILE, "w") as f:
        json.dump(scores, f, indent=4)

def add_score(player_name, score):
    scores = _load_scores()
    timestamp = datetime.datetime.now().isoformat()
    scores.append({"player_name": player_name, "score": score, "timestamp": timestamp})
    scores.sort(key=lambda x: x["score"], reverse=True)
    _save_scores(scores[:5]) # Keep only top 5

def get_high_scores():
    return _load_scores()

if __name__ == '__main__':
    # Example usage
    print("Adding some test scores...")
    add_score("Alice", 100)
    add_score("Bob", 150)
    add_score("Charlie", 75)
    add_score("David", 200)
    add_score("Eve", 125)
    add_score("Frank", 175)

    print("\nHigh Scores:")
    for i, s in enumerate(get_high_scores()):
        print(f"{i+1}. {s['player_name']} - {s['score']} ({s['timestamp']})")
