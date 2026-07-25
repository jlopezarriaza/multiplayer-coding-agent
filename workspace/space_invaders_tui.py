import os
import random
import time
import sys
import argparse
import score_manager
import termios
import tty
import fcntl

# --- Constants ---
GRID_WIDTH = 60
GRID_HEIGHT = 30
GAME_SPEED = 0.1  # Seconds per frame

# ANSI Escape Codes for colors and cursor manipulation
COLOR_RESET = "\033[0m"
COLOR_PLAYER = "\033[92m"    # Player Ship
COLOR_INVADER = "\033[91m"   # Invaders
COLOR_MISSILE_PLAYER = "\033[93m" # Player Missiles (Yellow)
COLOR_MISSILE_INVADER = "\033[95m" # Invader Missiles (Magenta)
COLOR_BUNKER = "\033[94m"    # Bunkers (Blue)
COLOR_BORDER = "\033[90m"    # Border (Dark Grey)
COLOR_SCORE = "\033[97m"     # Score/Info (White)
COLOR_GAME_OVER = "\033[91m" # Game Over (Red)

# Symbols
PLAYER_SHIP = "^"
INVADER_A = "V" # Example invader types
INVADER_B = "W"
INVADER_C = "M"
PLAYER_MISSILE = "|"
INVADER_MISSILE = "v"
BUNKER_FULL = "#"
BUNKER_DAMAGED_1 = "n"
BUNKER_DAMAGED_2 = "u"
BUNKER_QUARTER = "t"
BORDER_HORIZONTAL = "="
BORDER_VERTICAL = "|"
BORDER_CORNER = "+"

# Game settings
PLAYER_START_LIVES = 3
INVADER_ROWS = 3
INVADER_COLS = 8
INVADER_START_Y = 2
INVADER_SPACING_X = 5
INVADER_SPACING_Y = 2
MISSILE_SPEED = 1
PLAYER_SPEED = 1
INVADER_MOVE_INTERVAL = 10 # frames
DEMO_FRAMES = 40 # Total frames for demo mode
BASE_INVADER_MOVE_INTERVAL = 20 # Base frames for invader movement
INVADER_SPEED_SCALE_FACTOR = 5 # How much speed increases per invader removed

class PlayerShip:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.lives = PLAYER_START_LIVES
        self.shield_energy = 3 # Initial shield energy
        self.score = 0
        self.symbol = PLAYER_SHIP
        self.color = COLOR_PLAYER

    def draw(self, screen_buffer):
        if 0 <= self.y < len(screen_buffer) and 0 <= self.x < len(screen_buffer[0]):
            screen_buffer[self.y][self.x] = self.color + self.symbol + COLOR_RESET

    def move_left(self):
        self.x = max(0, self.x - PLAYER_SPEED)

    def move_right(self):
        self.x = min(GRID_WIDTH - 1, self.x + PLAYER_SPEED)

    def fire(self):
        return Projectile(self.x, self.y - 1, -MISSILE_SPEED, PLAYER_MISSILE, COLOR_MISSILE_PLAYER, "player")

class Invader:
    def __init__(self, x, y, invader_type='V'): # Default to Scout
        self.x = x
        self.y = y
        self.invader_type = invader_type
        self.alive = True
        self.health = 1 # Default health
        self.set_properties_by_type(invader_type)

    def set_properties_by_type(self, invader_type):
        if invader_type == 'V': # Scout
            self.symbol = INVADER_A
            self.points_value = 10
            self.health = 1
        elif invader_type == 'W': # Cruiser
            self.symbol = INVADER_B
            self.points_value = 20
            self.health = 1
        elif invader_type == 'M': # Dreadnought Boss
            self.symbol = INVADER_C
            self.points_value = 100
            self.health = 5
        self.color = COLOR_INVADER

    def draw(self, screen_buffer):
        if self.alive and 0 <= self.y < len(screen_buffer) and 0 <= self.x < len(screen_buffer[0]):
            screen_buffer[self.y][self.x] = self.color + self.symbol + COLOR_RESET

    def move(self, dx, dy):
        self.x += dx
        self.y += dy

    def fire(self):
        if self.alive:
            return Projectile(self.x, self.y + 1, MISSILE_SPEED, INVADER_MISSILE, COLOR_MISSILE_INVADER, "invader")
        return None

class AlienArmy:
    def __init__(self):
        self.invaders = []
        self.direction = 1 # 1 for right, -1 for left
        self.move_down_next = False
        self.move_counter = 0
        self._initialize_invaders()

    def _initialize_invaders(self):
        for row in range(INVADER_ROWS):
            for col in range(INVADER_COLS):
                x = col * INVADER_SPACING_X + (GRID_WIDTH - (INVADER_COLS -1) * INVADER_SPACING_X) // 2
                y = row * INVADER_SPACING_Y + INVADER_START_Y
                # Assign different invader types based on row for variety
                if row == 0:
                    invader_type = 'M' # Dreadnought Boss (Top row visually)
                elif row == 1:
                    invader_type = 'W' # Cruiser (Middle row visually)
                else: # row == 2
                    invader_type = 'V' # Scout (Bottom row visually)
                self.invaders.append(Invader(x, y, invader_type))

    def draw(self, screen_buffer):
        for invader in self.invaders:
            invader.draw(screen_buffer)

    def update(self, current_invader_move_interval):
        self.move_counter += 1
        if self.move_counter < current_invader_move_interval:
            return

        self.move_counter = 0
        
        alive_invaders = self.get_alive_invaders()
        if not alive_invaders:
            return # No invaders left to move

        min_x = min(invader.x for invader in alive_invaders)
        max_x = max(invader.x for invader in alive_invaders)

        if self.direction == 1 and max_x >= GRID_WIDTH - 2: # -2 to account for border
            self.move_down_next = True
            self.direction = -1
        elif self.direction == -1 and min_x <= 1: # +1 to account for border
            self.move_down_next = True
            self.direction = 1

        for invader in alive_invaders:
            if self.move_down_next:
                invader.move(0, 1) # Move down
            else:
                invader.move(self.direction, 0) # Move horizontally
        self.move_down_next = False
    
    def get_alive_invaders(self):
        return [invader for invader in self.invaders if invader.alive]

    def fire(self):
        alive_invaders = self.get_alive_invaders()
        if alive_invaders:
            invader = random.choice(alive_invaders)
            return invader.fire()
        return None

class Projectile:
    def __init__(self, x, y, dy, symbol, color, owner):
        self.x = x
        self.y = y
        self.dy = dy # Change in y per frame
        self.symbol = symbol
        self.color = color
        self.owner = owner # "player" or "invader"

    def draw(self, screen_buffer):
        if 0 <= self.y < len(screen_buffer) and 0 <= self.x < len(screen_buffer[0]):
            screen_buffer[self.y][self.x] = self.color + self.symbol + COLOR_RESET

    def update(self):
        self.y += self.dy
        # Remove if off screen
        return 0 <= self.y < GRID_HEIGHT

class ProjectileManager:
    def __init__(self):
        self.projectiles = []

    def add_projectile(self, projectile):
        if projectile:
            self.projectiles.append(projectile)

    def update(self):
        self.projectiles = [p for p in self.projectiles if p.update()]

    def draw(self, screen_buffer):
        for p in self.projectiles:
            p.draw(screen_buffer)

class Renderer:
    def __init__(self, width, height):
        self.width = width
        self.height = height
        self.screen_buffer = [[' ' for _ in range(width)] for _ in range(height)]
        self.clear_screen_command = f"\033[H\033[J" # ANSI escape codes to clear screen and move cursor to home

    def clear_screen(self):
        sys.stdout.write(self.clear_screen_command)
        sys.stdout.flush()

    def render(self):
        # Flatten the 2D buffer into a single string for faster printing
        output = ""
        for row in self.screen_buffer:
            output += "".join(row) + "\n"
        
        sys.stdout.write(output)
        sys.stdout.flush()

        # Reset buffer for next frame
        self.screen_buffer = [[' ' for _ in range(self.width)] for _ in range(self.height)]

    def draw_game_over(self, score):
        self.clear_screen()
        game_over_text = "GAME OVER"
        score_text = f"SCORE: {score}"
        
        game_over_x = (self.width - len(game_over_text)) // 2
        game_over_y = self.height // 2 - 1
        score_x = (self.width - len(score_text)) // 2
        score_y = self.height // 2 + 1

        sys.stdout.write(f"\033[{game_over_y};{game_over_x}H{COLOR_GAME_OVER}{game_over_text}{COLOR_RESET}\n")
        sys.stdout.write(f"\033[{score_y};{score_x}H{COLOR_SCORE}{score_text}{COLOR_RESET}\n")
        sys.stdout.flush()


class GameEngine:
    def __init__(self, width, height):
        self.width = width
        self.height = height
        self.player = PlayerShip(width // 2, height - 2)
        self.alien_army = AlienArmy()
        self.projectile_manager = ProjectileManager()
        self.renderer = Renderer(width, height)
        self.game_over = False
        self.frame_count = 0

        # Input handling setup
        self.old_settings = None
        
    def _setup_input(self):
        self.old_settings = termios.tcgetattr(sys.stdin)
        tty.setcbreak(sys.stdin.fileno())
        # Set stdin to non-blocking
        fd = sys.stdin.fileno()
        fl = fcntl.fcntl(fd, fcntl.F_GETFL)
        fcntl.fcntl(fd, fcntl.F_SETFL, fl | os.O_NONBLOCK)

    def _restore_input(self):
        if self.old_settings:
            termios.tcsetattr(sys.stdin, termios.TCSADRAIN, self.old_settings)
            # Restore blocking behavior
            fd = sys.stdin.fileno()
            fl = fcntl.fcntl(fd, fcntl.F_GETFL)
            fcntl.fcntl(fd, fcntl.F_SETFL, fl & ~os.O_NONBLOCK)

    def handle_input(self):
        try:
            key = sys.stdin.read(1)
            if key == 'a':
                self.player.move_left()
            elif key == 'd':
                self.player.move_right()
            elif key == ' ':
                self.projectile_manager.add_projectile(self.player.fire())
            elif key == 'q':
                self.game_over = True
        except IOError:
            # No input available
            pass

    def update_game_state(self):
        if self.game_over:
            return

        self.frame_count += 1
        
        alive_invaders_count = len(self.alien_army.get_alive_invaders())
        if alive_invaders_count > 0:
            # Dynamic speed scaling: faster as fewer invaders remain
            # The interval decreases as alive_invaders_count decreases
            current_invader_move_interval = max(1, BASE_INVADER_MOVE_INTERVAL - (INVADER_COLS * INVADER_ROWS - alive_invaders_count) // INVADER_SPEED_SCALE_FACTOR)
        else:
            current_invader_move_interval = BASE_INVADER_MOVE_INTERVAL # No invaders, effectively doesn't matter

        self.alien_army.update(current_invader_move_interval)
        self.projectile_manager.update()

        # Invader firing
        if self.frame_count % 30 == 0: # Invaders fire every 30 frames
            self.projectile_manager.add_projectile(self.alien_army.fire())
        
        self.check_collisions()
        
        if not self.alien_army.get_alive_invaders():
            self.game_over = True # All invaders defeated

        if self.player.lives <= 0:
            self.game_over = True

    def check_collisions(self):
        # Player missile - Invader collisions
        player_projectiles = [p for p in self.projectile_manager.projectiles if p.owner == "player"]
        invaders = self.alien_army.get_alive_invaders()

        for pp in player_projectiles:
            for invader in invaders:
                if invader.alive and pp.x == invader.x and pp.y == invader.y:
                    invader.health -= 1
                    if invader.health <= 0:
                        invader.alive = False
                        self.player.score += invader.points_value # Score for hitting an invader
                    pp.y = -1 # Mark projectile for removal
                    break

        # Invader missile - Player collisions
        invader_projectiles = [p for p in self.projectile_manager.projectiles if p.owner == "invader"]
        for ip in invader_projectiles:
            if ip.x == self.player.x and ip.y == self.player.y:
                if self.player.shield_energy > 0:
                    self.player.shield_energy -= 1
                else:
                    self.player.lives -= 1
                ip.y = self.height + 1 # Mark projectile for removal
                break
        
        # Check if invaders reached player's row
        for invader in invaders:
            if invader.alive and invader.y >= self.player.y:
                self.game_over = True
                break

    def draw(self):
        self.player.draw(self.renderer.screen_buffer)
        self.alien_army.draw(self.renderer.screen_buffer)
        self.projectile_manager.draw(self.renderer.screen_buffer)
        self.display_score_and_lives()
        self.renderer.render()

    def display_score_and_lives(self):
        score_text = f"SCORE: {self.player.score}"
        lives_text = f"LIVES: {self.player.lives}"
        shield_text = f"SHIELD: {self.player.shield_energy}"
        
        # Draw score on top left
        for i, char in enumerate(score_text):
            if i < self.width:
                self.renderer.screen_buffer[0][i] = COLOR_SCORE + char + COLOR_RESET

        # Draw lives on top right
        for i, char in enumerate(lives_text):
            if self.width - len(lives_text) + i >= 0:
                self.renderer.screen_buffer[0][self.width - len(lives_text) + i] = COLOR_PLAYER + char + COLOR_RESET

        # Draw shield in the middle top
        for i, char in enumerate(shield_text):
            start_x = (self.width - len(shield_text)) // 2
            if start_x + i < self.width:
                self.renderer.screen_buffer[0][start_x + i] = COLOR_BUNKER + char + COLOR_RESET

    def run(self, demo_mode=False, demo_frames=0):
        self.renderer.clear_screen()
        if not demo_mode:
            self._setup_input()

        frame_counter = 0
        try:
            while not self.game_over:
                if not demo_mode:
                    self.handle_input()
                self.update_game_state()
                self.draw()

                if demo_mode:
                    frame_counter += 1
                    if frame_counter >= demo_frames:
                        self.game_over = True
                
                time.sleep(GAME_SPEED)
        finally:
            self.renderer.clear_screen()
            if not demo_mode:
                self._restore_input()
            if self.game_over:
                self.renderer.draw_game_over(self.player.score)
                
                # Prompt for player name and save score
                player_name = input("Enter your name for the high score: ") # This will block in non-blocking input mode
                self._restore_input() # Restore blocking input temporarily for name input
                player_name = input("Enter your name for the high score: ")
                score_manager.add_score(player_name, self.player.score)
                self._setup_input() # Re-enable non-blocking input
                
                high_scores = score_manager.get_high_scores()
                self.renderer.display_high_scores(high_scores)
                time.sleep(5) # Display high scores for 5 seconds

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Terminal Space Invaders")
    parser.add_argument("--demo", action="store_true", help="Run in demo mode for a fixed number of frames")
    parser.add_argument("--run-tests", action="store_true", help="Run unit tests")
    args = parser.parse_args()

    if args.run_tests:
        game_engine = GameEngine(GRID_WIDTH, GRID_HEIGHT)
        game_engine._run_tests()
        sys.exit(0)
    
    game = GameEngine(GRID_WIDTH, GRID_HEIGHT)
    if args.demo:
        game.run(demo_mode=True, demo_frames=DEMO_FRAMES)
        sys.exit(0)
    else:
        game.run()

def run_tests():
    print("Running unit tests...")
    # PlayerShip shield/lives mechanics test
    test_player_ship_shield_mechanics()
    # Alien hit detection test
    test_alien_hit_detection()
    # Boss spawning test (Invader types)
    test_invader_type_spawning()
    print("All tests passed!")

def test_player_ship_shield_mechanics():
    print("Testing PlayerShip shield/lives mechanics...")
    player = PlayerShip(10, 10)
    initial_lives = player.lives
    
    # Simulate taking damage
    player.lives -= 1 
    assert player.lives == initial_lives - 1, f"Expected {initial_lives - 1} lives, got {player.lives}"

    player.lives -= 1
    assert player.lives == initial_lives - 2, f"Expected {initial_lives - 2} lives, got {player.lives}"

    print("PlayerShip shield/lives mechanics tests passed.")

def test_alien_hit_detection():
    print("Testing alien hit detection...")
    game_engine = GameEngine(GRID_WIDTH, GRID_HEIGHT)
    player = game_engine.player
    alien_army = game_engine.alien_army
    projectile_manager = game_engine.projectile_manager

    # Ensure there's at least one invader for testing
    assert len(alien_army.invaders) > 0, "No invaders to test hit detection."

    initial_score = player.score
    initial_invader_count = len(alien_army.get_alive_invaders())

    # Create a player projectile at an invader's location
    target_invader = alien_army.get_alive_invaders()[0]
    pp = Projectile(target_invader.x, target_invader.y, -MISSILE_SPEED, PLAYER_MISSILE, COLOR_MISSILE_PLAYER, "player")
    projectile_manager.add_projectile(pp)

    game_engine.check_collisions()

    assert not target_invader.alive, "Invader was not marked as dead after collision."
    assert player.score > initial_score, "Player score did not increase after hitting invader."
    assert len(alien_army.get_alive_invaders()) == initial_invader_count - 1, "Invader was not removed from alive invaders list."
    
    # Check if projectile is marked for removal
    assert pp.y == -1, "Player projectile not marked for removal after collision."
    
    print("Alien hit detection tests passed.")

def test_invader_type_spawning():
    print("Testing invader type spawning...")
    alien_army = AlienArmy()
    
    # Expected invader types and their properties
    expected_invader_configs = {
        # row 0: Dreadnought Boss 'M'
        INVADER_START_Y: {'type': 'M', 'points': 100, 'health': 5, 'symbol': INVADER_C},
        # row 1: Cruiser 'W'
        INVADER_START_Y + INVADER_SPACING_Y: {'type': 'W', 'points': 20, 'health': 1, 'symbol': INVADER_B},
        # row 2: Scout 'V'
        INVADER_START_Y + 2 * INVADER_SPACING_Y: {'type': 'V', 'points': 10, 'health': 1, 'symbol': INVADER_A},
    }
    
    invader_counts = { 'V': 0, 'W': 0, 'M': 0 }

    for invader in alien_army.invaders:
        invader_counts[invader.invader_type] += 1
        expected = expected_invader_configs.get(invader.y)
        
        assert expected is not None, f"Invader at unexpected y-coordinate: {invader.y}"
        assert invader.invader_type == expected['type'], f"Invader at y={invader.y} has wrong type: Expected {expected['type']}, got {invader.invader_type}"
        assert invader.points_value == expected['points'], f"Invader type {invader.invader_type} at y={invader.y} has wrong points: Expected {expected['points']}, got {invader.points_value}"
        assert invader.health == expected['health'], f"Invader type {invader.invader_type} at y={invader.y} has wrong health: Expected {expected['health']}, got {invader.health}"
        assert invader.symbol == expected['symbol'], f"Invader type {invader.invader_type} at y={invader.y} has wrong symbol: Expected {expected['symbol']}, got {invader.symbol}"

    # Check that each type is present in the expected number based on INVADER_COLS
    assert invader_counts['V'] == INVADER_COLS, f"Expected {INVADER_COLS} 'V' invaders, got {invader_counts['V']}"
    assert invader_counts['W'] == INVADER_COLS, f"Expected {INVADER_COLS} 'W' invaders, got {invader_counts['W']}"
    assert invader_counts['M'] == INVADER_COLS, f"Expected {INVADER_COLS} 'M' invaders, got {invader_counts['M']}"

    print("Invader type spawning tests passed.")
