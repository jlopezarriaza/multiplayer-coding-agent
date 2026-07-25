import os
import random
import time
import sys
import argparse
import termios
import tty
import fcntl

# --- Constants ---
GRID_WIDTH = 60
GRID_HEIGHT = 30
GAME_SPEED = 0.1  # Seconds per frame

# ANSI Escape Codes for colors and cursor manipulation
COLOR_RESET = "[0m"
COLOR_PLAYER = "[92m"    # Player Ship
COLOR_INVADER = "[91m"   # Invaders
COLOR_MISSILE_PLAYER = "[93m" # Player Missiles (Yellow)
COLOR_MISSILE_INVADER = "[95m" # Invader Missiles (Magenta)


class PlayerShip:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.lives = 3
        self.score = 0
        self.symbol = PLAYER_SHIP
        self.color = COLOR_PLAYER

    def draw(self, screen_buffer):
        if 0 <= self.y < len(screen_buffer) and 0 <= self.x < len(screen_buffer[0]):
            screen_buffer[self.y][self.x] = self.color + self.symbol + COLOR_RESET

class Invader:
    def __init__(self, x, y, invader_type):
        self.x = x
        self.y = y
        self.invader_type = invader_type
        self.alive = True
        self.set_properties_by_type(invader_type)

    def set_properties_by_type(self, invader_type):
        if invader_type == 'A':
            self.symbol = INVADER_A
            self.points_value = 10
        elif invader_type == 'B':
            self.symbol = INVADER_B
            self.points_value = 20
        else: # type 'C'
            self.symbol = INVADER_C
            self.points_value = 40
        self.color = COLOR_INVADER

    def draw(self, screen_buffer):
        if self.alive and 0 <= self.y < len(screen_buffer) and 0 <= self.x < len(screen_buffer[0]):
            screen_buffer[self.y][self.x] = self.color + self.symbol + COLOR_RESET

class PlayerMissile:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.speed = 1
        self.direction = -1 # -1 for up
        self.symbol = PLAYER_MISSILE
        self.color = COLOR_MISSILE_PLAYER

    def draw(self, screen_buffer):
        if 0 <= self.y < len(screen_buffer) and 0 <= self.x < len(screen_buffer[0]):
            screen_buffer[self.y][self.x] = self.color + self.symbol + COLOR_RESET

class InvaderMissile:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.speed = 1
        self.direction = 1 # 1 for down
        self.symbol = INVADER_MISSILE
        self.color = COLOR_MISSILE_INVADER

    def draw(self, screen_buffer):
        if 0 <= self.y < len(screen_buffer) and 0 <= self.x < len(screen_buffer[0]):
            screen_buffer[self.y][self.x] = self.color + self.symbol + COLOR_RESET

class Bunker:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.health = 4 # 4 hits to destroy
        self.set_symbol_by_health()
        self.color = COLOR_BUNKER

    def set_symbol_by_health(self):
        if self.health == 4:
            self.symbol = BUNKER_FULL
        elif self.health == 3:
            self.symbol = BUNKER_DAMAGED_1
        elif self.health == 2:
            self.symbol = BUNKER_DAMAGED_2
        elif self.health == 1:
            self.symbol = BUNKER_QUARTER
        else:
            self.symbol = ' ' # Destroyed

    def hit(self):
        self.health -= 1
        if self.health < 0:
            self.health = 0
        self.set_symbol_by_health()

    def draw(self, screen_buffer):
        if self.health > 0 and 0 <= self.y < len(screen_buffer) and 0 <= self.x < len(screen_buffer[0]):
            screen_buffer[self.y][self.x] = self.color + self.symbol + COLOR_RESET

# --- Global Game State (will be encapsulated in Game class) ---
# Placeholder for now, to be removed once Game class is fully implemented
# player_ship = None
# invaders_list = []
# player_missiles = []
# invader_missiles = []
# bunkers_list = []
# score = 0
# lives = 3
# wave_number = 1
# game_over = False
# demo_mode = False
# frame_count = 0
# current_wave_direction = 1 # 1 for right, -1 for left
# invader_descent_counter = 0


if __name__ == "__main__":
    main()
KER = "[94m"    # Bunkers (Blue)
COLOR_BORDER = "[90m"    # Border (Dark Grey)
COLOR_SCORE = "[97m"     # Score/Info (White)
COLOR_GAME_OVER = "[91m" # Game Over (Red)

# Symbols
PLAYER_SHIP = "A"
INVADER_A = "V" # Example invader types
INVADER_B = "W"
INVADER_C = "M"
PLAYER_MISSILE = "|"
INVADER_MISSILE = "v"
BUNKER_FULL = "#"
BUNKER_DAMAGED_1 = "n"
BUNKER_DAMAGED_2 = "u"
BORDER_HORIZONTAL = "="
BORDER_VERTICAL = "|"
BORDER_CORNER = "+"

class SpaceInvadersGame:
    def __init__(self, width, height):
        self.width = width
        self.height = height
        self.score = 0
        self.lives = 3
        self.game_over = False
        self.player_ship = None # Will be an object
        self.invaders = []      # List of Invader objects
        self.player_missiles = [] # List of PlayerMissile objects
        self.invader_missiles = [] # List of InvaderMissile objects
        self.bunkers = []       # List of Bunker objects
        self.wave_number = 1
        self.demo_mode = False
        self.frame_count = 0

        # Terminal settings for non-blocking input
        self.old_terminal_settings = None
        self.old_fcntl_flags = None

    def _setup_terminal(self):
        """Hides the cursor and clears the screen."""
        sys.stdout.write("[?25l")  # Hide cursor
        sys.stdout.write("[2J")   # Clear screen
        sys.stdout.flush()

        # Set terminal to raw mode for non-blocking input
        self.old_terminal_settings = termios.tcgetattr(sys.stdin)
        tty.setcbreak(sys.stdin.fileno())
        # Set stdin to non-blocking
        fd = sys.stdin.fileno()
        self.old_fcntl_flags = fcntl.fcntl(fd, fcntl.F_GETFL)
        fcntl.fcntl(fd, fcntl.F_SETFL, self.old_fcntl_flags | os.O_NONBLOCK)

    def _restore_terminal(self):
        """Restores the cursor and original terminal settings."""
        sys.stdout.write("[?25h")  # Show cursor
        sys.stdout.flush()
        if self.old_terminal_settings:
            termios.tcsetattr(sys.stdin, termios.TCSADRAIN, self.old_terminal_settings)
        if self.old_fcntl_flags is not None:
            fd = sys.stdin.fileno()
            fcntl.fcntl(fd, fcntl.F_SETFL, self.old_fcntl_flags)

    def _clear_screen(self):
        """Clears the entire screen by moving cursor to top-left and clearing."""
        sys.stdout.write("[H")  # Move cursor to top-left
        sys.stdout.write("[2J") # Clear screen
        sys.stdout.flush()



    def _draw_border(self, screen_buffer):
        """Draws the game border onto the screen buffer."""
        for x in range(self.width):
            self._draw_entity(screen_buffer, x, 0, BORDER_HORIZONTAL, COLOR_BORDER)
            self._draw_entity(screen_buffer, x, self.height - 1, BORDER_HORIZONTAL, COLOR_BORDER)
        for y in range(self.height):
            self._draw_entity(screen_buffer, 0, y, BORDER_VERTICAL, COLOR_BORDER)
            self._draw_entity(screen_buffer, self.width - 1, y, BORDER_VERTICAL, COLOR_BORDER)
        
        self._draw_entity(screen_buffer, 0, 0, BORDER_CORNER, COLOR_BORDER)
        self._draw_entity(screen_buffer, self.width - 1, 0, BORDER_CORNER, COLOR_BORDER)
        self._draw_entity(screen_buffer, 0, self.height - 1, BORDER_CORNER, COLOR_BORDER)
        self._draw_entity(screen_buffer, self.width - 1, self.height - 1, BORDER_CORNER, COLOR_BORDER)


    def _render(self):
        """Renders the current game state to the terminal using a screen buffer."""
        screen_buffer = [[" " for _ in range(self.width)] for _ in range(self.height)]

        self._draw_border(screen_buffer)

        # TODO: Draw player, invaders, missiles, bunkers

        # Display score and lives
        score_text = f"SCORE: {self.score:05d}  LIVES: {self.lives}  WAVE: {self.wave_number}"
        self._draw_entity(screen_buffer, 2, 0, score_text, COLOR_SCORE) # Overwrite border for score

        # Flatten the buffer and print
        output = "\n".join(["".join(row) for row in screen_buffer])
        sys.stdout.write(f"[H{output}") # Move cursor to home and print
        sys.stdout.flush()

    def run(self, demo_mode=False, demo_frames=50):
        self.demo_mode = demo_mode
        self._setup_terminal()
        try:
            while not self.game_over:
                self.frame_count += 1
                if self.demo_mode and self.frame_count > demo_frames:
                    break # Exit demo mode

                char = self._get_input()
                if char:
                    self.handle_input(char)

                # TODO: Update game state
                
                self._render()
                time.sleep(GAME_SPEED)

            if self.game_over:
                # TODO: Game over screen
                pass

        finally:
            self._restore_terminal()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Space Invaders TUI Game")
    parser.add_argument("--demo", action="store_true", help="Run in demo mode")
    parser.add_argument("--demo_frames", type=int, default=100, help="Number of frames for demo mode")
    args = parser.parse_args()

    game = SpaceInvadersGame(GRID_WIDTH, GRID_HEIGHT)
    game.run(demo_mode=args.demo, demo_frames=args.demo_frames)
