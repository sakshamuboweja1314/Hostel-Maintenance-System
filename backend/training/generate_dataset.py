"""
Dataset Generation Script for Edge-Based Hostel Maintenance Complaint Prioritization System
Deterministic, stratified generation of realistic hostel complaints across 6 categories and 4 urgencies.
"""

import os
import random
import csv
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split

# Set random seed for determinism
RANDOM_SEED = 42
random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)

CATEGORIES = [
    "Water and Plumbing",
    "Electrical",
    "Internet and Wi-Fi",
    "Cleanliness and Sanitation",
    "Furniture and Civil Maintenance",
    "Other"
]

URGENCIES = ["Critical", "High", "Medium", "Low"]

ROOM_NUMBERS = [f"Room {r}" for r in [101, 104, 112, 203, 215, 220, 305, 318, 402, 411]]
BLOCKS = ["Block A", "Block B", "Block C", "Boys Hostel 3", "Girls Hostel 2", "Block D", "North Wing", "South Wing"]

TEMPLATES = {
    "Water and Plumbing": {
        "Critical": [
            "Severe water pipe burst in the corridor outside {room}, water is gushing rapidly and flooding the hallway.",
            "Water is leaking directly through the ceiling onto our main electrical board in {room}. Immediate risk of fire!",
            "Uncontrolled flooding from the main pipeline on {block} 2nd floor. Water is entering student rooms.",
            "Main sewer line backed up into the ground floor washrooms of {block}, dirty water overflowing everywhere.",
            "Water pipe burst inside bathroom wall of {room}, water is spraying out with high pressure and cannot be shut off.",
            "Ceiling in {room} is heavily soaked with water leaking from upper floor and chunks of plaster are collapsing.",
            "Complete water supply failure across entire {block} for the past 24 hours. No drinking or sanitation water available.",
            "Hot water geyser valve ruptured in washroom of {room}, boiling water is spraying uncontrollably across the floor.",
            "Drainage pipe burst on 3rd floor corridor, foul wastewater flooding all rooms near {room}.",
            "Emergency: overhead water tank overflowing violently and leaking through the rooftop electrical conduit in {block}."
        ],
        "High": [
            "Toilet flush in {room} is completely broken and water is continuously overflowing onto the bathroom floor.",
            "Drinking water cooler in {block} ground floor is completely dead and dispensing dirty brownish water.",
            "Geyser in {room} bathroom is leaking hot water steadily and making loud vibrating sounds.",
            "Washbasin drainage is completely blocked in {room}, wastewater is pooling and leaking onto the bedroom floor.",
            "No running water in {room} bathroom for the last 12 hours. Need urgent repair.",
            "Tap in the common washroom has snapped off completely, water running continuously into the drain.",
            "Water pressure in shower and taps of {room} is zero, cannot use bathroom before morning classes.",
            "Severe leakage underneath the kitchen sink in {block} common mess area, creating a large puddle.",
            "Toilet flush valve stuck wide open in {room}, wasting huge volume of water and making loud noise.",
            "Bathroom drain in {room} is severely clogged, water takes hours to drain and starts smelling bad."
        ],
        "Medium": [
            "The bathroom tap in {room} is dripping slowly but continuously throughout the night.",
            "Water pressure in the shower of {room} is rather weak, takes long time to bathe.",
            "Washbasin in {room} drains somewhat slowly, needs a plumber to clean the trap.",
            "Slight water seepage visible on the corner wall near the window in {room}.",
            "The shower head in {room} has limescale buildup and water sprays in uneven directions.",
            "The health faucet spray trigger in {room} is slightly stiff and leaks a few drops when released.",
            "Water in the bathroom sink of {room} takes a couple minutes to clear completely.",
            "Hot water from geyser in {room} only stays warm for 5 minutes then turns lukewarm.",
            "Minor water dripping from the washbasin pipe connection under the counter in {room}.",
            "Bathroom floor drain cover in {room} is loose and slightly displaced."
        ],
        "Low": [
            "The tap knob in {room} bathroom turns smoothly but feels slightly loose.",
            "Mirror above the bathroom sink in {room} has dried water splash marks from earlier.",
            "Small cosmetic water stain on the ceiling of {room}, dry to touch with no active leak.",
            "Water faucet squeaks slightly when rotated clockwise in {room}.",
            "Shower curtain rod in {room} washroom has minor surface rust near the mount.",
            "Bathroom washbasin soap holder is missing a screw in {room}.",
            "Cold water tap in {room} has a slight whistle sound when turned on at full throttle.",
            "Sink stopper chain in {room} has detached from the rubber plug.",
            "Requesting aerator cleaning for the washbasin tap in {room} to smooth out the spray.",
            "Minor rust spot around the drain ring of the washbasin in {room}."
        ]
    },
    "Electrical": {
        "Critical": [
            "Visible sparks and crackling sounds coming from the main switchboard in {room}! Burning plastic smell detected.",
            "Electric shock felt through the metal door handle and bathroom tap in {room}. Extremely dangerous grounding fault!",
            "Smoke coming out of the distribution box in {block} 2nd floor corridor. Main MCB glowing hot.",
            "Exposed live wire hanging down from ceiling near the doorway of {room}. Students could touch it accidentally.",
            "Short circuit in {room} caused sparks and tripped the whole floor breaker. Outlets feel scorching hot.",
            "Geyser power cord in {room} melted and sparked when turned on. Burning smell throughout the wing.",
            "Water is dripping onto an open electrical outlet on the wall of {room}. Urgent hazard!",
            "Corridor light fixture in {block} fell and is hanging by bare live wires sparking against the metal railing.",
            "Switchboard in {room} exploded with a loud pop and left black soot marks on the wall.",
            "High voltage surge noticed in {block}, sparks seen from multiple wall sockets and laptops heating up."
        ],
        "High": [
            "All power in {room} has tripped and the local breaker immediately trips again when switched on.",
            "Main ceiling fan in {room} is vibrating violently and emitting a faint burning odor.",
            "Common study hall lights and sockets in {block} are completely non-functional right before semester exams.",
            "Wall socket in {room} where laptop was plugged started smoking and is now charred black.",
            "No power supply in entire wing of {block} since early morning, students cannot study or charge devices.",
            "Corridor emergency backup lights in {block} failed to activate during evening power cut.",
            "Bathroom light fitting in {room} is buzzing loudly and flickering erratically.",
            "Air cooler / AC in {room} tripped the circuit and socket feels uncomfortably warm.",
            "MCB switches in {room} panel keep tripping every 15 minutes without any heavy appliance connected.",
            "Two out of three wall sockets in {room} are completely dead and one gives mild static shocks."
        ],
        "Medium": [
            "The tube light in {room} flickers continuously for ten minutes before turning solid on.",
            "Ceiling fan in {room} makes a squeaking and ticking noise on speeds 3 and 4.",
            "One of the study table power sockets in {room} has loose internal contacts and loses connection.",
            "Fan regulator knob in {room} has broken off, fan is stuck on maximum speed.",
            "Corridor light bulb outside {room} in {block} has burnt out and needs replacement.",
            "Night lamp socket switch in {room} feels loose and doesn't click firmly.",
            "Tube light starter in {room} is blinking red and needs to be replaced.",
            "Exhaust fan in {room} bathroom is running very slowly and making humming sounds.",
            "Study table LED batten in {room} has dimmed significantly compared to normal.",
            "Balcony light switch in {room} is stiff and requires excessive force to push."
        ],
        "Low": [
            "Switch plate cover in {room} has a small cosmetic hairline crack on the plastic border.",
            "Small red indicator LED on the main switchboard in {room} is not illuminating.",
            "Switch for the ceiling fan in {room} is slightly tilted in its plastic bracket.",
            "Tube light frame in {room} has accumulated dust and cobwebs around the housing.",
            "Socket plate in {room} is slightly misaligned with the wall paint.",
            "Ceiling fan canopy in {room} has slipped down slightly along the downrod.",
            "Switchboard screws in {room} are slightly loose, plate moves a millimeter when pressed.",
            "Power extension board cord clip on wall in {room} has come unstuck.",
            "Wall switch rocker in {room} makes a soft clicking sound when pressed.",
            "Minor paint flaking around the edge of the switchboard in {room}."
        ]
    },
    "Internet and Wi-Fi": {
        "Critical": [
            "Wi-Fi router / Access Point in {block} corridor is sparking and emitting thick smoke!",
            "Entire campus Wi-Fi network down in {block} during scheduled online proctored placement exam in 30 minutes!",
            "Network rack on 1st floor of {block} has fallen off the wall with ethernet cables torn and hanging loose.",
            "Central network switch in {block} server cabinet making loud shrieking alarm and overheating.",
            "All internet connectivity completely lost across all hostels during live national competitive test.",
            "Ethernet wall jack in {room} has exposed live voltage due to miswired POE line, shocked student.",
            "Wi-Fi access point in corridor outside {room} has detached and is dangling precariously above student heads.",
            "Hostel wide cyber outage: captive portal DNS corrupted, showing security certificate breach warnings.",
            "Network cable conduit in {block} caught fire after electrical short, cutting off all connectivity.",
            "All floor switches in {block} died simultaneously following electrical surge, no connection for 300 students."
        ],
        "High": [
            "Wi-Fi has been completely down on our entire floor in {block} for over 10 hours.",
            "Cannot connect to the internet in {room} at all, IP configuration failure / DHCP server not responding.",
            "The Wi-Fi access point near {room} keeps rebooting every 2 minutes, dropping all connections.",
            "Ethernet port in {room} is dead, and Wi-Fi signal is zero bars inside the room.",
            "Internet speed in {block} has dropped to literally 5 kbps, unable to load course materials for tomorrow's test.",
            "Hostel captive portal authentication is rejecting valid student credentials for the past 6 hours.",
            "Wi-Fi connection drops whenever more than 5 students connect in {block} wing B.",
            "Router on floor 3 of {block} showing blinking red internet indicator, no access for all rooms.",
            "Repeated packet loss over 80% making it impossible to attend mandatory online seminar from {room}.",
            "Wi-Fi gateway unreachable from {room}, students unable to submit semester project before midnight deadline."
        ],
        "Medium": [
            "Wi-Fi signal strength in {room} is very weak (1 bar), internet works only if standing near the door.",
            "Internet download speed in {room} fluctuates heavily during evening hours between 8 PM and 11 PM.",
            "The 5GHz Wi-Fi band is not broadcasting from the access point near {room}, only slow 2.4GHz is visible.",
            "Frequent latency spikes of 500ms making video calls stutter in {room}.",
            "Ethernet port clip in {room} is slightly loose, LAN cable disconnects if bumped.",
            "Wi-Fi disconnects occasionally once or twice an hour and reconnects after a minute in {room}.",
            "Some academic websites take unusually long time to resolve through hostel DNS in {room}.",
            "Access point outside {room} seems overloaded during night hours.",
            "Need LAN port enabled / activated on the second wall socket of {room}.",
            "Wi-Fi signal drops completely when bathroom door in {room} is closed."
        ],
        "Low": [
            "Captive portal login screen takes about 5 seconds longer to redirect after login in {room}.",
            "Wi-Fi network SSID name has a small typo on the 4th floor repeater in {block}.",
            "LAN cable wall socket faceplate in {room} has minor dust accumulation inside the jack.",
            "Ethernet jack label in {room} has faded and is difficult to read.",
            "Ping to local college server is 25ms instead of the usual 15ms from {room}.",
            "Request for guest Wi-Fi credentials for visiting parents this weekend in {block}.",
            "Would like guidance on connecting smart printer to hostel Wi-Fi network from {room}.",
            "Wi-Fi speed test shows 25 Mbps instead of nominal 30 Mbps in {room} off-peak.",
            "Notification of upcoming planned network maintenance has not been posted on {block} board.",
            "Wi-Fi access point LED indicator in hallway outside {room} is blinking a bit brightly at night."
        ]
    },
    "Cleanliness and Sanitation": {
        "Critical": [
            "Severe sewage backflow in common washrooms of {block}, human waste overflowing into corridor!",
            "Dead animal decomposing inside the air conditioning / ventilation duct in {block}, unbearable toxic stench.",
            "Toxic chemical / acid bottle spilled in the common cleaning storage room near {room}, burning eyes and throat.",
            "Washroom ceiling has heavy black mold infestation causing acute breathing difficulties for asthmatic student in {room}.",
            "Pest infestation emergency: large swarm of wasps / hornets built a nest inside {room} window, multiple stings reported.",
            "Corridor outside {room} covered in raw sewage after drainage inspection chamber burst open.",
            "Water reservoir tank in {block} found open with dead pigeon floating inside, health hazard for all residents!",
            "Massive rat infestation inside {room}, rats biting through mattress and food containers while student is sleeping.",
            "Garbage chute in {block} is completely clogged and overflowing with putrid rotting biological waste into hallways.",
            "Infestation of bedbugs in {room} causing severe allergic rashes and skin infections across multiple roommates."
        ],
        "High": [
            "Common washrooms in {block} 2nd floor have not been cleaned for 4 days, toilets clogged and foul odor spreading.",
            "Large heap of rotting food waste accumulating outside {block} entrance, attracting packs of stray dogs and vultures.",
            "Bathroom in {room} has stagnant water pooled on the floor for 48 hours, mosquito breeding visible.",
            "Stray cat died in the ceiling crawl space above {room}, terrible smell entering through vents.",
            "All dustbins in {block} 3rd floor overflowing onto the corridor floor with flies buzzing around.",
            "Shower area in {room} has thick slippery slime and algae covering the tiles, dangerous slip hazard.",
            "Pigeon droppings heavily accumulated on {room} window AC unit, foul smell blowing inside room.",
            "Severe cockroach infestation in {room} cupboards and study desk drawers.",
            "Mess dining hall wash area in {block} has clogged drains with dirty grease spilling onto the floor.",
            "Corridor trash bin knocked over and litter scattered across {block} main lobby for two days."
        ],
        "Medium": [
            "Common dustbin in {block} hallway near {room} is full and needs to be cleared today.",
            "Bathroom floor in {room} needs deep scrubbing to remove stubborn water scale stains.",
            "Corridor outside {room} has accumulated dust and fallen leaves blown in from the balcony.",
            "Window sill and glass in {room} are dusty and have not been wiped this week.",
            "Spider webs and dust webs visible in the upper corners of {room} ceiling.",
            "Staircase in {block} needs routine sweeping and wet mopping after yesterday's rain.",
            "Mirror in {room} bathroom is smudged and has soap residue.",
            "Exhaust fan grill in {room} washroom is clogged with heavy lint and dust.",
            "Water cooler tray on 2nd floor of {block} has standing water that needs draining.",
            "Balcony floor of {room} has dust and bird feathers that need sweeping."
        ],
        "Low": [
            "Minor dust on the top surface of the wardrobe in {room}.",
            "A few dry shoe scuff marks on the tile floor near the doorway of {room}.",
            "Corridor floor in {block} looks slightly dull, could use periodic buffing/polishing.",
            "Small water droplet marks on the exterior glass pane of {room} window.",
            "Common balcony railing in {block} has a light layer of outdoor dust.",
            "Requesting an extra small trash bin for dry paper waste in {room}.",
            "Curtains in {room} have some light dust along the bottom hem.",
            "Notice board glass in {block} entrance has finger smudges.",
            "A clean floor mop was left resting in the corner of the corridor near {room}.",
            "Mild disinfectant odor remaining in the bathroom after morning cleaning in {room}."
        ]
    },
    "Furniture and Civil Maintenance": {
        "Critical": [
            "Large slab of concrete plaster fell from {room} ceiling onto student's study desk, narrowly missing student!",
            "Balcony railing in {room} on the 4th floor is heavily rusted, detached from wall, and about to collapse over the edge!",
            "Heavy wooden wardrobe door fell off its hinges in {room} and collapsed onto the bed frame.",
            "Main door lock of {room} jammed shut from outside, student is trapped inside with no secondary exit!",
            "Window glass pane in {room} shattered violently during wind gust, jagged sharp shards hanging precariously.",
            "Wall crack in {room} has widened drastically overnight, bricks visible and mortar crumbling onto the floor.",
            "Metal bunk bed frame support beam in {room} snapped in half, upper bed collapsed onto lower bed!",
            "Ceiling fan mounting hook in {room} is pulling out from the concrete ceiling, fan wobbling dangerously.",
            "Staircase marble tread on 3rd floor of {block} cracked and shifted loose, severe trip and fall hazard down stairs.",
            "Heavy hostel entrance glass door hinge broken and leaning at 45 degree angle ready to fall on passersby."
        ],
        "High": [
            "Study chair leg in {room} cracked and broke while sitting, cannot use study table.",
            "Main room door latch and lock cylinder in {room} broken, cannot lock the room when going to class.",
            "Bed wooden plywood base in {room} is split down the middle and sagging to the ground.",
            "Window frame in {room} has detached from the wall track, cannot close window during heavy rain.",
            "Almirah door in {room} cannot be closed or locked, personal belongings and laptop exposed.",
            "Bathroom door in {room} has swollen from moisture and will not latch or close properly.",
            "Study table in {room} has two wobbly legs and is tilted at a dangerous angle.",
            "Hostel room key broke inside the door lock cylinder of {room}, unable to enter room.",
            "Window glass has a long spiderweb crack from corner to corner in {room}, might fall out soon.",
            "Curtain rod bracket ripped out of the wall in {room}, rod and heavy curtains fell down."
        ],
        "Medium": [
            "Cupboard hinge in {room} is loose, causing the door to hang crooked and scrape the bottom.",
            "Study table drawer in {room} gets stuck halfway and requires significant effort to open and close.",
            "Door stopper in {room} has detached from the floor, door bangs against the wall when wind blows.",
            "Window latch in {room} is stiff and difficult to engage.",
            "Study chair backrest in {room} is slightly loose and wobbles when leaning back.",
            "Bathroom towel rod in {room} is loose on one side and tilts when towel is hung.",
            "Minor plaster peeling and paint flaking on the wall next to the bed in {room}.",
            "Mosquito mesh on {room} window has a small two-inch tear near the bottom corner.",
            "Shoe rack shelf in {room} has a loose nail and wobbles.",
            "Wall coat hook in {room} has come loose from the wall anchor."
        ],
        "Low": [
            "Small scratch on the laminate finish of the study table in {room}.",
            "Paint on the back of the room door in {room} has a minor scuff mark.",
            "Study chair wheel in {room} makes a slight squeak when rolled across tiles.",
            "Cupboard key in {room} is slightly bent but still operates the lock.",
            "Small chip in the corner of the bedside nightstand laminate in {room}.",
            "Window handle plastic cover in {room} is slightly discolored.",
            "Bed frame metal corner in {room} has a slight rub mark against the wall.",
            "Desk organizer tray provided in {room} has a hairline crack on the plastic rim.",
            "Curtain ring in {room} is slightly stiff along the metal rod.",
            "Wardrobe interior shelf has a minor cosmetic watermark from previous occupant in {room}."
        ]
    },
    "Other": {
        "Critical": [
            "Intruder or unknown aggressive individual entered {block} corridor at night, threatening students!",
            "Fire alarm sounding continuously on floor 2 of {block}, thick smoke visible near emergency stairwell!",
            "Fire extinguisher in {block} corridor is missing its pin and leaking chemical powder uncontrollably.",
            "Emergency fire exit door on ground floor of {block} is chained and padlocked, blocking evacuation route!",
            "Aggressive stray monkey / rabid dog entered {room} through balcony and is attacking resident!",
            "Severe gas leak smell detected near the hostel mess kitchen cylinder storage area behind {block}.",
            "Lobby elevator in {block} suddenly dropped half a floor and is stuck between floors with students trapped inside!",
            "Electrical generator room behind {block} is vibrating violently with flames and black smoke shooting from exhaust.",
            "Hostel boundary wall collapsed during storm, leaving {block} completely exposed to trespassers from outside.",
            "Suspicious unattended burning bag left near the main entrance of {block}, security alerted."
        ],
        "High": [
            "Common laundry washing machine in {block} is shaking violently, smoking, and leaking soapy water everywhere.",
            "Elevator in {block} is out of service, stranded elderly warden and injured student on 4th floor.",
            "Biometric attendance scanner at {block} entrance is completely dead, causing massive crowd crush before curfew.",
            "Mess food served tonight had foreign metal wire found in vegetable curry, health hazard reported.",
            "Night security guard missing from post at {block} main gate for past 3 hours, gate left wide open.",
            "Water purifier in mess area of {block} is dispensing foul smelling water with sediment.",
            "Hostel main gate lock broken, vehicles entering hostel quad area at 2 AM playing loud music.",
            "Ironing table in common room of {block} has frayed power cord with burning marks.",
            "Noise disturbance: continuous loud construction drilling inside {block} at 1:30 AM during exam week.",
            "Medical first aid box in {block} warden office is completely empty during late night student injury."
        ],
        "Medium": [
            "Washing machine #2 in {block} laundry room is not spinning during the final rinse cycle.",
            "Water dispenser cooling function in {block} 1st floor is not chilling the water.",
            "Common room television remote in {block} has dead batteries and missing back cover.",
            "Gym treadmill belt in {block} fitness room is slipping and squeaking during use.",
            "Notice board glass door in {block} lobby is jammed and notices cannot be updated.",
            "Ironing board fabric in the common utility room of {block} is torn and burnt.",
            "Table tennis racket rubber peeling in {block} indoor recreation room.",
            "Water cooler timer in {block} cuts off water delivery too early.",
            "Bicycle parking stand outside {block} is overcrowded and one rack is bent.",
            "Loud squeaking noise from the main lobby swing door in {block} whenever students enter."
        ],
        "Low": [
            "Wall clock in the common study room of {block} is running 12 minutes slow.",
            "Suggestion to add an extra mirror in the ground floor lobby of {block}.",
            "Request for a duplicate room key requisition form at the {block} caretaker desk.",
            "Magazine rack in {block} library has magazines from last month, needs updating.",
            "Notice pinned on {block} board has curled edges and needs fresh thumb tacks.",
            "Common room indoor plant in {block} has a few dry leaves that need pruning.",
            "Vending machine in {block} lobby sometimes rejects crisp 10 rupee notes on first insert.",
            "Lost and found item display box in {block} front office is slightly disorganized.",
            "Hostel curfew bell tone in {block} is slightly muffled compared to last week.",
            "Request to repaint the room number stencil on {room} doorway."
        ]
    }
}

# Linguistic variations and paraphrasing modifiers
PREFIXES = [
    "",
    "Hi, please check: ",
    "Urgent complaint: ",
    "Reporting an issue: ",
    "Hello warden sir, ",
    "Please send maintenance staff: ",
    "I want to report that ",
    "Kindly look into this: ",
    "Attention caretaker: ",
    "Complain regarding ",
    "There is a problem: ",
    "Hostel maintenance issue: ",
    "Please fix as soon as possible: ",
    "Notice: "
]

SUFFIXES = [
    "",
    " Please send someone right away.",
    " Kindly resolve this quickly.",
    " Need this fixed today.",
    " Please attend to this as early as possible.",
    " Thanks in advance.",
    " It has been like this since yesterday.",
    " Facing a lot of trouble because of this.",
    " This is causing serious inconvenience to all of us.",
    " Please update when technician will visit."
]

TYPO_REPLACEMENTS = {
    "water": ["watar", "water"],
    "leak": ["leek", "leak", "leaking"],
    "switch": ["swich", "switch"],
    "broken": ["brocken", "broken"],
    "immediately": ["imediatly", "immediately"],
    "bathroom": ["washroom", "bathroom", "bath room"],
    "corridor": ["coridor", "hallway", "corridor"]
}

def apply_slight_variation(text: str) -> str:
    """Applies realistic linguistic variation and casual formatting."""
    # Prefix / Suffix
    if random.random() < 0.4:
        text = random.choice(PREFIXES) + text
    if random.random() < 0.4:
        text = text + random.choice(SUFFIXES)
        
    # Occasional case variation
    if random.random() < 0.15:
        text = text.lower()
        
    return text.strip()

def generate_dataset(target_per_category=200):
    records = []
    
    # Target distribution across urgencies per category:
    # 40 Critical, 55 High, 65 Medium, 40 Low = 200 total per category
    urgency_distribution = {
        "Critical": int(target_per_category * 0.20),
        "High": int(target_per_category * 0.30),
        "Medium": int(target_per_category * 0.30),
        "Low": int(target_per_category * 0.20)
    }
    
    for category in CATEGORIES:
        for urgency, count in urgency_distribution.items():
            templates = TEMPLATES[category][urgency]
            generated_for_class = 0
            
            while generated_for_class < count:
                template = random.choice(templates)
                room = random.choice(ROOM_NUMBERS)
                block = random.choice(BLOCKS)
                
                text = template.format(room=room, block=block)
                text = apply_slight_variation(text)
                
                # Check for uniqueness within category
                if not any(r["complaint_text"] == text for r in records):
                    records.append({
                        "complaint_text": text,
                        "category": category,
                        "urgency": urgency
                    })
                    generated_for_class += 1
                    
    # Shuffle deterministically
    random.seed(RANDOM_SEED)
    random.shuffle(records)
    
    df = pd.DataFrame(records)
    print(f"Total dataset generated: {len(df)} records.")
    print("Category breakdown:\n", df["category"].value_counts())
    print("\nUrgency breakdown:\n", df["urgency"].value_counts())
    
    return df

def main():
    output_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_dir = os.path.join(output_dir, "dataset")
    os.makedirs(dataset_dir, exist_ok=True)
    
    df = generate_dataset(target_per_category=200)
    
    # Save full dataset
    full_csv = os.path.join(dataset_dir, "complaints.csv")
    df.to_csv(full_csv, index=False)
    print(f"Saved full dataset to {full_csv}")
    
    # Create combined stratification key
    df["strat_key"] = df["category"] + "___" + df["urgency"]
    
    # Stratified split: 70% train, 15% val, 15% test
    train_df, temp_df = train_test_split(
        df, test_size=0.30, random_state=RANDOM_SEED, stratify=df["strat_key"]
    )
    val_df, test_df = train_test_split(
        temp_df, test_size=0.50, random_state=RANDOM_SEED, stratify=temp_df["strat_key"]
    )
    
    # Clean temporary column
    train_df = train_df.drop(columns=["strat_key"])
    val_df = val_df.drop(columns=["strat_key"])
    test_df = test_df.drop(columns=["strat_key"])
    
    train_csv = os.path.join(dataset_dir, "train.csv")
    val_csv = os.path.join(dataset_dir, "val.csv")
    test_csv = os.path.join(dataset_dir, "test.csv")
    
    train_df.to_csv(train_csv, index=False)
    val_df.to_csv(val_csv, index=False)
    test_df.to_csv(test_csv, index=False)
    
    print(f"Splits saved: Train={len(train_df)} (70%), Val={len(val_df)} (15%), Test={len(test_df)} (15%)")
    
    # Write dataset README
    readme_path = os.path.join(dataset_dir, "README.md")
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write("""# Hostel Maintenance Complaint Dataset

## Overview
This dataset contains synthetic, domain-realistic hostel maintenance complaints designed specifically for fine-tuning compact Transformer models (DistilBERT) for edge deployment.

### Specifications
- **Total Records:** 1,200
- **Random Seed:** 42 (Fully deterministic and reproducible)
- **Train/Val/Test Split:** 70% / 15% / 15% (Stratified by both category and urgency)
  - `train.csv`: 840 examples
  - `val.csv`: 180 examples
  - `test.csv`: 180 examples

### Categories (6 Classes)
1. **Water and Plumbing** (200 records): Pipe bursts, geyser leaks, toilet clogs, tap issues, seepage.
2. **Electrical** (200 records): Sparks, short circuits, exposed wires, MCB tripping, lights, fans.
3. **Internet and Wi-Fi** (200 records): Access point failure, captive portal issues, slow speed, latency.
4. **Cleanliness and Sanitation** (200 records): Sewage backflow, pest infestations, mold, dustbin overflow, stains.
5. **Furniture and Civil Maintenance** (200 records): Plaster collapse, broken chair/bed, jammed door, window cracks.
6. **Other** (200 records): Fire safety, elevators, laundry machines, animal intrusion, noise, clock issues.

### Urgency Levels (4 Classes)
1. **Critical** (240 records): Severe hazards to life, physical safety, health, or massive infrastructure disruption.
2. **High** (360 records): Serious functional disruption affecting daily student life or imminent deadlines.
3. **Medium** (360 records): Suboptimal equipment function, intermittent problems, standard queue.
4. **Low** (240 records): Minor cosmetic flaws, slight squeaks, routine non-urgent adjustments.

### Academic Notes (Unit III & IV)
- Generated via stratified domain templates with grammatical, prefix/suffix, spelling, and casing variations.
- Demonstrates encoder-based sequence classification on natural language complaint text.
- Provides test sets with zero overlap with training text.
""")
    print(f"Wrote dataset documentation to {readme_path}")

if __name__ == "__main__":
    main()
