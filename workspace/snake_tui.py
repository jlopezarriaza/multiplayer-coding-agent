
import os
import random
import time
import sys
import argparse

# --- Constants ---
GRID_WIDTH = 40
GRID_HEIGHT = 20
INITIAL_SNAKE_LENGTH = 3
DEMO_FRAMES = 25
GAME_SPEED = 0.1  # Seconds per frame

# ANSI Escape Codes for colors and cursor manipulation
COLOR_RESET = "\033[0m"
COLOR_GREEN = "\033[92m"  # Snake
COLOR_RED = "\033[91m"    # Food
COLOR_BLUE = "\033[94m"   # Border
COLOR_YELLOW = "\033[93m" # Score/Game Over
COLOR_WALL = "\033[90m" # Obstacle Walls

# Symbols
SNAKE_HEAD = "O"
SNAKE_BODY = "o"
FOOD = "*"
BORDER_HORIZONTAL = "-"
BORDER_VERTICAL = "|"
BORDER_CORNER = "+"
WALL = "#"

# --- Global Game State ---
snake = []
food = (0, 0)
score = 0
direction = (0, 1)  # (row_change, col_change) - initially moving right
game_over = False
demo_mode = False
frame_count = 0
walls = [] # List of (row, col) for obstacle walls

# --- Terminal Control Functions ---
def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def set_cursor_position(row, col):
    sys.stdout.write(f"\033[{row};{col}H")
    sys.stdout.flush()

def hide_cursor():
    sys.stdout.write("\033[?25l")
    sys.stdout.flush()

def show_cursor():
    sys.stdout.write("\033[?25h")
    sys.stdout.flush()

# --- Game Logic Functions ---
def initialize_game():
    global snake, food, score, direction, game_over, frame_count, walls
    snake = [(GRID_HEIGHT // 2, GRID_WIDTH // 2 - i) for i in range(INITIAL_SNAKE_LENGTH)]
    direction = (0, 1) # Start moving right
    score = 0
    game_over = False
    frame_count = 0
    
    # Define some obstacle walls
    walls = []
    # Create a rectangular obstacle in the center
    for r in range(GRID_HEIGHT // 2 - 3, GRID_HEIGHT // 2 + 3):
        for c in range(GRID_WIDTH // 2 - 5, GRID_WIDTH // 2 + 5):
            if (r == GRID_HEIGHT // 2 - 3 or r == GRID_HEIGHT // 2 + 2 or
                c == GRID_WIDTH // 2 - 5 or c == GRID_WIDTH // 2 + 4):
                walls.append((r, c))
    
    spawn_food()

def spawn_food():
    global food
    while True:
        new_food = (random.randint(1, GRID_HEIGHT - 2), random.randint(1, GRID_WIDTH - 2))
        if new_food not in snake and new_food not in walls:
            food = new_food
            break

def draw_grid():
    set_cursor_position(0, 0)
    sys.stdout.write(COLOR_BLUE)
    # Top border
    print(BORDER_CORNER + BORDER_HORIZONTAL * (GRID_WIDTH - 2) + BORDER_CORNER)
    # Middle rows
    for r in range(GRID_HEIGHT - 2):
        print(BORDER_VERTICAL + " " * (GRID_WIDTH - 2) + BORDER_VERTICAL)
    # Bottom border
    print(BORDER_CORNER + BORDER_HORIZONTAL * (GRID_WIDTH - 2) + BORDER_CORNER)
    sys.stdout.write(COLOR_RESET)

def draw_elements():
    # Draw snake
    sys.stdout.write(COLOR_GREEN)
    for i, (r, c) in enumerate(snake):
        set_cursor_position(r, c)
        sys.stdout.write(SNAKE_HEAD if i == 0 else SNAKE_BODY)
    sys.stdout.write(COLOR_RESET)

    # Draw food
    sys.stdout.write(COLOR_RED)
    set_cursor_position(food[0], food[1])
    sys.stdout.write(FOOD)
    sys.stdout.write(COLOR_RESET)

    # Draw score
    sys.stdout.write(COLOR_YELLOW)
    set_cursor_position(GRID_HEIGHT, 0)
    sys.stdout.write(f"Score: {score}")
    sys.stdout.write(COLOR_RESET)

def draw_walls():
    sys.stdout.write(COLOR_WALL)
    for r, c in walls:
        set_cursor_position(r, c)
        sys.stdout.write(WALL)
    sys.stdout.write(COLOR_RESET)

def update_game_state():
    global snake, food, score, direction, game_over

    head_r, head_c = snake[0]
    new_head = (head_r + direction[0], head_c + direction[1])

    # Check for collisions
    # Wall collision
    if not (1 <= new_head[0] < GRID_HEIGHT - 1 and 1 <= new_head[1] < GRID_WIDTH - 1) or new_head in walls:
        game_over = True
        return
    # Self-collision
    if new_head in snake:
        game_over = True
        return

    snake.insert(0, new_head)

    # Check if food is eaten
    if new_head == food:
        score += 1
        spawn_food()
    else:
        # Remove tail if no food eaten
        set_cursor_position(snake[-1][0], snake[-1][1])
        sys.stdout.write(" ") # Clear old tail position
        snake.pop()

def handle_input():
    # For a full TUI, this would use a library like curses or getch
    # For demo, we just cycle directions or keep current
    pass # In demo mode, input is simulated or ignored

def simulate_input():
    global direction
    # Simple demo logic: try to move towards food
    food_r, food_c = food
    head_r, head_c = snake[0]

    dr, dc = direction

    # Prioritize moving towards food without immediately hitting a wall or self
    possible_directions = [(0, 1), (0, -1), (1, 0), (-1, 0)] # Right, Left, Down, Up
    random.shuffle(possible_directions) # Introduce some randomness

    best_direction = direction
    min_distance = float('inf')

    for ndr, ndc in possible_directions:
        # Avoid reversing direction
        if (ndr, ndc) == (-dr, -dc):
            continue

        next_head = (head_r + ndr, head_c + ndc)

        # Check for wall collision
        if not (1 <= next_head[0] < GRID_HEIGHT - 1 and 1 <= next_head[1] < GRID_WIDTH - 1) or next_head in walls:
            continue

        # Check for self-collision (in next frame)
        if next_head in snake[:-1]: # Don't check against tail if it's going to move
            continue

        # Calculate Manhattan distance to food
        distance = abs(food_r - next_head[0]) + abs(food_c - next_head[1])

        if distance < min_distance:
            min_distance = distance
            best_direction = (ndr, ndc)

    direction = best_direction


def game_loop():
    global game_over, frame_count

    hide_cursor()
    clear_screen()
    initialize_game()
    draw_grid()
    draw_walls()

    while not game_over:
        if demo_mode:
            simulate_input()
            frame_count += 1
            if frame_count > DEMO_FRAMES:
                game_over = True # Exit after demo frames
        else:
            handle_input() # In a real game, this would get actual input

        update_game_state()
        draw_elements()

        if game_over:
            break

        time.sleep(GAME_SPEED)

    # Game Over screen or message
    sys.stdout.write(COLOR_YELLOW)
    set_cursor_position(GRID_HEIGHT // 2, GRID_WIDTH // 2 - 5)
    sys.stdout.write("GAME OVER!")
    set_cursor_position(GRID_HEIGHT // 2 + 1, GRID_WIDTH // 2 - 8)
    sys.stdout.write(f"Final Score: {score}")
    sys.stdout.write(COLOR_RESET)
    set_cursor_position(GRID_HEIGHT + 2, 0) # Move cursor below game area
    sys.stdout.flush()

    show_cursor()

def main():
    global demo_mode
    parser = argparse.ArgumentParser(description="Terminal UI Snake Game")
    parser.add_argument("--demo", action="store_true", help=f"Run a {DEMO_FRAMES}-frame demo automatically.")
    args = parser.parse_args()

    demo_mode = args.demo

    try:
        game_loop()
    except KeyboardInterrupt:
        pass
    finally:
        show_cursor()
        clear_screen() # Ensure a clean exit
        # For demo mode, ensure exit code 0
        if demo_mode and game_over and frame_count > DEMO_FRAMES:
            sys.exit(0)
        elif demo_mode and not game_over: # This case shouldn't happen if game_over is set
            sys.exit(1) # Indicate error if demo didn't complete as expected
        elif not demo_mode and game_over: # Normal game over
            sys.exit(0)
        else: # Game exited unexpectedly (e.g. KeyboardInterrupt outside demo)
            sys.exit(1)


if __name__ == "__main__":
    main()
