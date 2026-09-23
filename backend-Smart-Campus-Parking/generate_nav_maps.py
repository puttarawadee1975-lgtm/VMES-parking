import os
import sys
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend for server rendering
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import matplotlib.patheffects as patheffects
import networkx as nx

def build_parking_lot():
    """Builds a directed graph representing the underground garage layout."""
    G = nx.DiGraph()

    nodes = {
        "ENTRANCE":  {"x": 86, "y": 30},
        "EXIT":      {"x": 2,  "y": 30},
        "JCT_IN":    {"x": 86, "y": 16},
        "JCT_MID_1": {"x": 60, "y": 16},
        "JCT_MID_2": {"x": 35, "y": 16},
        "JCT_OUT":   {"x": 2,  "y": 16},
        "B-01": {"x": 98, "y": 20},
        "B-02": {"x": 98, "y": 8},
        "D-01": {"x": -6.5, "y": 21},
    }

    # Zone A Spots (A-01 to A-10)
    for i in range(1, 11):
        spot_id = f"A-{i:02d}"
        nodes[spot_id] = {"x": 13 + ((i - 1) * 7.2), "y": 23}

    # Zone C Spots (C-01 to C-08)
    bottom_spots = {
        "C-01": {"x": -6.5, "y": 5.0},
        "C-02": {"x": 3,    "y": 2.0},
        "C-03": {"x": 15,   "y": 2.0},
        "C-04": {"x": 25,   "y": 2.0},
        "C-05": {"x": 36,   "y": 2.0},
        "C-06": {"x": 46,   "y": 2.0},
        "C-07": {"x": 73,   "y": 2.0},
        "C-08": {"x": 85,   "y": 2.0}
    }
    nodes.update(bottom_spots)

    for n, attrs in nodes.items():
        G.add_node(n, **attrs)

    # Driving Corridor Pathing
    G.add_edge("ENTRANCE", "JCT_IN", weight=14)
    G.add_edge("JCT_IN", "JCT_MID_1", weight=26)
    G.add_edge("JCT_MID_1", "JCT_MID_2", weight=25)
    G.add_edge("JCT_MID_2", "JCT_OUT", weight=33)
    G.add_edge("JCT_OUT", "EXIT", weight=14)

    # Zone A Connections
    for i in range(1, 11):
        s_id = f"A-{i:02d}"
        jct = "JCT_IN" if i > 7 else ("JCT_MID_1" if i > 3 else "JCT_MID_2")
        G.add_edge(jct, s_id, weight=5)

    # Zone B & D Connections
    G.add_edge("JCT_IN", "B-01", weight=6)
    G.add_edge("JCT_IN", "B-02", weight=6)
    G.add_edge("JCT_OUT", "D-01", weight=6)

    # Zone C Connections
    G.add_edge("JCT_IN", "C-08", weight=6)
    G.add_edge("JCT_IN", "C-07", weight=6)
    G.add_edge("JCT_MID_1", "C-06", weight=6)
    G.add_edge("JCT_MID_1", "C-05", weight=6)
    G.add_edge("JCT_MID_2", "C-04", weight=6)
    G.add_edge("JCT_MID_2", "C-03", weight=6)
    G.add_edge("JCT_OUT", "C-02", weight=6)
    G.add_edge("JCT_OUT", "C-01", weight=6)

    return G

def generate_navigation_image(G, target_spot, output_file_path):
    """Renders the dark-mode 2D floor plan navigation route and saves to output_file_path."""
    try:
        path = nx.shortest_path(G, source="ENTRANCE", target=target_spot, weight="weight")
    except Exception:
        path = None

    fig, ax = plt.subplots(figsize=(12, 4.2), facecolor="#14171D")
    ax.set_facecolor("#14171D")

    COLOR_WALL = "#2A2F3B"
    COLOR_LANE = "#1E232A"
    COLOR_LINE = "#3B4252"
    COLOR_TEXT = "#E5E9F0"
    COLOR_ACCENT = "#00E676"  # Neon green highlight for target spot
    COLOR_PATH = "#00B0FF"    # Neon blue navigation overlay

    # 1. Main Driving Floor
    ax.add_patch(patches.Rectangle((-14, -4), 122, 40, facecolor=COLOR_LANE, zorder=0))

    # --- TOP WALLS & ROADS ---
    ax.add_patch(patches.FancyBboxPatch((-14, 26), 13, 8, facecolor=COLOR_WALL, edgecolor="none", zorder=2))
    ax.add_patch(patches.FancyBboxPatch((8, 26), 72, 8, facecolor=COLOR_WALL, edgecolor="none", zorder=2))
    ax.add_patch(patches.FancyBboxPatch((92, 26), 16, 8, facecolor=COLOR_WALL, edgecolor="none", zorder=2))

    # Entrance / Exit HUD Markers
    ax.text(3.5, 31, "EXIT", color="#FF5252", fontsize=10, fontweight="bold", ha="center", zorder=3)
    ax.text(86, 31, "ENTRANCE", color="#00E676", fontsize=10, fontweight="bold", ha="center", zorder=3)

    # --- MOTORCYCLE ZONES (B & D) ---
    is_d1_target = (target_spot == "D-01")
    d1_bg = COLOR_ACCENT if is_d1_target else "#2E3440"
    d1_fg = "#000000" if is_d1_target else "#88C0D0"
    ax.add_patch(patches.FancyBboxPatch((-14, 16), 13, 10, facecolor=d1_bg, edgecolor=COLOR_LINE, linewidth=1, zorder=2))
    ax.text(-7.5, 20, "D-01", color=d1_fg, fontsize=8, fontweight="bold", ha="center", va="center", zorder=3)

    is_b1_target = (target_spot == "B-01")
    b1_bg = COLOR_ACCENT if is_b1_target else "#2E3440"
    b1_fg = "#000000" if is_b1_target else "#88C0D0"
    ax.add_patch(patches.FancyBboxPatch((92, 14), 16, 12, facecolor=b1_bg, edgecolor=COLOR_LINE, linewidth=1, zorder=2))
    ax.text(100, 20, "B-01", color=b1_fg, fontsize=8, fontweight="bold", ha="center", zorder=3)
    ax.plot([92, 108], [14, 14], color=COLOR_LINE, linewidth=1, zorder=3)

    is_b2_target = (target_spot == "B-02")
    b2_bg = COLOR_ACCENT if is_b2_target else "#2E3440"
    b2_fg = "#000000" if is_b2_target else "#88C0D0"
    ax.add_patch(patches.FancyBboxPatch((92, 2), 16, 12, facecolor=b2_bg, edgecolor=COLOR_LINE, linewidth=1, zorder=2))
    ax.text(100, 8, "B-02", color=b2_fg, fontsize=8, fontweight="bold", ha="center", zorder=3)

    # Left Wall Structural Pillars
    ax.plot([-14, -1], [16, 16], color=COLOR_LINE, linewidth=2, zorder=3)
    ax.add_patch(patches.Rectangle((-14, 9), 13, 2, facecolor=COLOR_WALL, zorder=2))
    ax.add_patch(patches.Rectangle((-14, -3), 13, 6, facecolor=COLOR_WALL, zorder=2))

    # --- ZONE A SPOTS ---
    for i in range(1, 11):
        spot_id = f"A-{i:02d}"
        x = 8 + ((i - 1) * 7.2)
        is_target = (spot_id == target_spot)
        
        ax.plot([x, x + 3.2], [25, 20.5], color=COLOR_LINE, linewidth=1, zorder=3)
        
        box_color = COLOR_ACCENT if is_target else "#2E3440"
        text_color = "#000000" if is_target else COLOR_TEXT
        
        ax.text(x + 5, 23.2, spot_id, color=text_color, fontsize=8, fontweight="bold",
                rotation=-60, ha="center", va="center", zorder=4,
                bbox=dict(boxstyle="round,pad=0.2", facecolor=box_color, edgecolor="none"))

    # --- ZONE C SPOTS & PILLARS ---
    pillar_coords = [(8, -3), (30, -3), (50, -3), (66, -3), (92, -3)]
    for px, py in pillar_coords:
        w = 16 if px == 92 else 3
        ax.add_patch(patches.FancyBboxPatch((px, py), w, 7, facecolor=COLOR_WALL, edgecolor="none", linewidth=1, zorder=2))

    zone_c_positions = {
        "C-01": -6.5, "C-02": 3, "C-03": 15, "C-04": 25,
        "C-05": 36, "C-06": 46, "C-07": 73, "C-08": 85
    }

    ax.plot([20, 20], [-3, 4], color=COLOR_LINE, linewidth=1, linestyle="-", zorder=3)
    ax.plot([41, 41], [-3, 4], color=COLOR_LINE, linewidth=1, linestyle="-", zorder=3)
    ax.plot([79, 79], [-3, 4], color=COLOR_LINE, linewidth=1, linestyle="-", zorder=3)

    for spot_id, x_pos in zone_c_positions.items():
        is_target = (spot_id == target_spot)
        box_color = COLOR_ACCENT if is_target else "#2E3440"
        text_color = "#000000" if is_target else COLOR_TEXT
        y_pos = 6 if spot_id == "C-01" else 2.0

        ax.text(x_pos, y_pos, spot_id, color=text_color, fontsize=8, fontweight="bold",
                ha="center", va="center", zorder=4,
                bbox=dict(boxstyle="round,pad=0.3", facecolor=box_color, edgecolor="none"))

    # --- GLOWING NAVIGATION PATH ---
    if path:
        path_x = [G.nodes[n]["x"] for n in path]
        path_y = [G.nodes[n]["y"] for n in path]

        # Path Glow Layer
        ax.plot(path_x, path_y, color=COLOR_PATH, linewidth=8, alpha=0.3, zorder=5,
                path_effects=[patheffects.SimpleLineShadow(), patheffects.Normal()])
        
        # Solid Path Line
        ax.plot(path_x, path_y, color=COLOR_PATH, linewidth=3.5, linestyle="-", zorder=6)

        # Start Node (Entrance)
        ax.scatter(path_x[0], path_y[0], color="#00E676", s=60, edgecolors="white", linewidth=1.5, zorder=7)

        # Target Node (Destination)
        ax.scatter(path_x[-1], path_y[-1], color="#FFD700", s=120, marker="*", zorder=8)

    # --- FLOATING TOP NAVIGATION HUD CARD ---
    ax.text(10, 31, "NAVIGATING TO:", color="#88C0D0", fontsize=9, fontweight="bold", zorder=10)
    ax.text(26, 31, f"SPOT {target_spot}", color=COLOR_ACCENT, fontsize=11, fontweight="bold", zorder=10)
    ax.text(68, 31, "STATUS: Reserved", color="#EBCB8B", fontsize=9, fontweight="bold", zorder=10)

    # Plot Bounds
    ax.set_xlim(-15, 109)
    ax.set_ylim(-4, 34)
    ax.set_aspect("equal")
    plt.axis("off")
    plt.tight_layout()
    
    os.makedirs(os.path.dirname(output_file_path), exist_ok=True)
    plt.savefig(output_file_path, dpi=180, bbox_inches='tight', pad_inches=0.04, facecolor='#14171D')
    plt.close(fig)

def generate_all_nav_maps():
    G = build_parking_lot()
    
    backend_static_dir = os.path.join(os.path.dirname(__file__), "static", "nav_maps")
    mobile_assets_dir = os.path.join(os.path.dirname(__file__), "..", "mobile-app", "assets", "nav_maps")
    os.makedirs(backend_static_dir, exist_ok=True)
    os.makedirs(mobile_assets_dir, exist_ok=True)

    all_spots = [f"A-{i:02d}" for i in range(1, 11)] + \
                [f"B-{i:02d}" for i in range(1, 3)] + \
                [f"C-{i:02d}" for i in range(1, 9)] + \
                ["D-01"]

    print(f"🗺️ Generating navigation maps for {len(all_spots)} spots...")
    for s_id in all_spots:
        filename = f"nav_{s_id}.png"
        b_path = os.path.join(backend_static_dir, filename)
        m_path = os.path.join(mobile_assets_dir, filename)

        generate_navigation_image(G, s_id, b_path)
        import shutil
        shutil.copy(b_path, m_path)
        print(f"  • Generated {s_id} -> {filename}")

    print("✅ All navigation maps generated successfully!")

if __name__ == "__main__":
    generate_all_nav_maps()
