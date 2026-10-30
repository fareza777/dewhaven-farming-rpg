"""Author the native campaign. Does not change the reference pack or planning catalogues."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "unity/Dewhaven/Assets/Dewhaven/Resources/Dewhaven/Content"
PLAN = ROOT / "docs/unity/data"
def read(folder, name): return json.loads((folder / (name + ".json")).read_text(encoding="utf-8-sig"))
def write(name, data): (CONTENT / (name + ".json")).write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
def item(name, amount, keep=False): return {"item":name,"amount":amount,**({"keep":True} if keep else {})}
def stat(name, amount, label=None): return {"stat":name,"amount":amount,"label":label or name.replace("-", " ")}
def visit(name): return {"visit":name,"amount":1}

catalogue = read(PLAN,"quests")
legacy = {q["id"]:q for q in read(CONTENT,"simulation")["legacyQuests"]}
main_requirements = [
 [stat("planted",3,"Seeds planted"),visit("farm")],
 [stat("harvested",5,"Crops harvested")], [stat("met",6,"People met")],
 [stat("earned",1000,"Gold shipped")], [item("wood",20),item("stone",15)],
 [stat("crafted",3,"Things made"),item("copper",6)],
 [item("turnip",5),item("egg",3),item("trout",1),item("bouquet",1)],
 [visit("aster-quay"),stat("site:quay-ledger",1,"Delivery ledger read")],
 [item("wood",10),item("copper",4)],
 [visit("saltwind-cliffs"),stat("inspect:tide-vault",1,"Water diagram inspected")],
 [stat("tideVault",1,"Tide Vault recovered"),item("ancient_chart",1,True)],
 [visit("sunridge"),visit("orchard-house")], [item("jam",2),item("corn",4)],
 [item("wood",6),item("stone",10)],
 [stat("emberVault",1,"Ember Gallery recovered"),item("glass_lens",1,True)],
 [stat("site:weather-bench",1,"Weather bench assembled")],
 [visit("briar-hollow"),item("ancient_chart",1,True),item("glass_lens",1,True)],
 [item("wood",8),item("iron",2)],
 [stat("skyVault",1,"Observatory recovered"),item("brass_compass",1,True)],
 [stat("route-checks",3,"Safe route checks")],
 [stat("attended:quay-fair",1,"Harbour table"),stat("attended:orchard-fair",1,"Orchard table"),stat("attended:archive-fair",1,"Archive table")],
 [stat("public-rooms",4,"Shared rooms reopened")],
 [stat("convoy-delivered",1,"Convoy arrived after dawn")],
 [item("ancient_chart",1,True),item("glass_lens",1,True),item("brass_compass",1,True)],
]
main_lines = [
 ("If this letter has found you, the house is yours. Start with three rows. A place becomes home through the small things you return to each morning.","Three rows, a little water, and a beginning. The next page names Mira at the seedhouse. Take your first harvest into town."),
 ("Those pale turnips came from your grandmother's seed tin. Bring in five crops when they're ready. I want to know which of the old varieties survived.","There they are. She kept these seeds through three lean winters. Keep a packet for next season. Elias has been asking who opened the farm."),
 ("There are people here who remember the farm, and people who arrived after it closed. Meet six of us. You won't learn a valley from a map alone.","Now there are names behind the doors. Cleo could use a steady grower again. Speak to her about the kitchen deliveries."),
 ("The kettle is full, but my pantry isn't. Ship a thousand gold of produce from your crate. The morning cart still stops at the old gate.","Your vegetables made it onto today's menu. Rowan says the river crossing needs timber. Fix it and the cart can use the shorter road."),
 ("The west footbridge has sound foundations and rotten boards. Twenty timber and fifteen stone will do it. I'll take the materials here and finish the crossing.","The new boards are down. No more picking through the riverbank. Orin found something in the conservatory while we were clearing the approach."),
 ("The garden frame is worth saving. Bring six copper, and get some practice at your workbench. Three finished pieces should tell us what you can handle.","The pipes hold. We found a letter tucked behind the old pump: a harbour stamp, four towns, and a promise to keep the winter cupboards full."),
 ("Before we ask the harbour for help, let's keep a promise here. Five turnips, three eggs, a trout, and flowers for the long table. Simple food, enough to share.","Aya brought the old delivery book to supper. Your grandmother's name is beside every winter run. Sera at Aster Quay has the other half of the ledger."),
 ("I thought that farm mark had disappeared. Read the ledger on my workbench. The boats carried food inland before the cliff landing failed.","Your grandmother planned a route between four public kitchens. Basil can repair the landing winch. We could start with one safe crossing."),
 ("The brake has seized, but the frame is sound. Four copper and ten timber will make the landing usable. Then you can reach the archive beneath the cliffs.","Try the brake. It holds. The cliff landing is open, and Marin has the safest path to the old archive."),
 ("Keep to the dry stair on Saltwind Cliffs. In the first room, read the water diagram before touching the wheels. The archive was built to work with the tide.","You've seen how the channels fit together. Sera needs the chart case beyond the pump, carts and salt lock. Take your time; the way out stays open."),
 ("The coast changes with every storm. That chart is our missing record. Recover it from the case, and bring it here so we can read the orchard route.","Cedar Downs, then Sunridge. The orchard kitchens sent preserves on every autumn run. Keep the chart; you'll need all three instruments to rebuild the atlas."),
 ("Sera wrote ahead. Come inside the orchard house. I kept the long table, even after the deliveries stopped. It seemed wrong to turn it into firewood.","We still have the table. Now we need a reason to fill it. Two jars of preserves and four ears of corn would make a start."),
 ("The orchard workers have been eating on the steps. Bring two preserves and four corn. We'll lay the table properly and leave room for late arrivals.","Ada stayed for seconds. Pavel even put his tools down. He knows the quarry gate, where the old weather lens was made."),
 ("The glassworks road is buried under loose stone. Six timber for the supports, ten stone for the drain. I'll clear a safe approach to the freight lift.","The quarry drain is running again. The Ember Gallery is open. Orin can tell you which part of the weather instrument we're looking for."),
 ("A wrapped lens was left in the insulated chamber. Balance the lift, vent the cooling hall, then align the reflector. It is engineering, not a treasure hunt.","No chips in the glass. Excellent. Bring it to the weather bench here; the chart's markings will make more sense with the lens fitted."),
 ("The bench needs two copper and a crystal mount. Fit them here, compare the coastal marks, and we'll know which route can carry winter supplies.","The lines meet at Briar Hollow. Ilan has your grandmother's unfinished atlas. Take both instruments to the archive."),
 ("She left the mountain section blank on purpose. An untested route is worse than an empty page. Vesper can reopen the sheltered upper stair.","The chart gives us distances; the lens gives us weather readings. We still need the observatory's compass. First, make the upper road safe."),
 ("Eight timber and two iron will give the stair solid rails. I won't send anyone up a route I can't bring them down from.","The rails and rest landings are ready. Read the gust markings before crossing the observatory platforms. The descent stays available throughout."),
 ("The observatory was a weather station. Open its shutters, seat the gears, and align the meridian plates. Bring back the brass compass in the final gallery.","Three instruments, at last. Jun wants to test the route against the map before a cart follows it. Start at the three survey points on Observatory Rise."),
 ("Don't wait for winter to find a bad landing. Check the three survey stations on the rise. Compare the slope, shelter, and return path at each.","The notes agree with the ground. Now the route needs people at both ends. Join the harbour, orchard, and archive tables so the hosts can plan together."),
 ("A delivery needs a welcome as much as a road. Sit at the three weekly tables, bring a dish, and hear what each town can offer.","The kitchens have agreed on their part. Marin has a list of repairs for the four shared rooms. They should be ready before the first convoy."),
 ("Four rooms, four doors left open. Each host has a repair basket at their shared room. Timber, stone, and a little care will put them back into daily use.","The rooms are furnished and the cupboards are dry. Aya can label the first three supply crates at your farmhouse. After you pack them, let the morning cart do its work."),
 ("At your shipping crate: pack one pantry box, one orchard box, and one repair box. I'll collect them at dawn. Meet me after the next morning's delivery.","All three crates arrived. Nothing lost, nobody stranded. Your grandmother started this route with a borrowed cart. We started it again with yours."),
 ("Bring the three instruments to the village table. The last page belongs to everyone who kept a door open, including you.","The atlas is finished, but the valley isn't. Crops still need water. Someone is setting another place at a table. Tomorrow, choose the part of this life you want to grow."),
]
restore={"mend-bridge":"bridge","garden-awakens":"greenhouse","safe-harbour":"winch","the-quarry-gate":"quarry","weather-not-wishes":"weather-bench","the-upper-road":"upper-stair","farther-lights":"atlas"}
entries=[]
for i, q in enumerate(catalogue["main"]):
    old=legacy.get(q["id"],{})
    entries.append({**q,"main":True,"requirements":main_requirements[i],"reward":old.get("reward",{"gold":650+i*35}),"opening":main_lines[i][0],"completion":main_lines[i][1],"restoration":restore.get(q["id"])})

side_specs={
 "miras-basket":[item("turnip",3)],"breakfast-club":[item("egg",3)],"woodland-kindness":[item("berry",5),item("mushroom",2)],
 "finns-catch":[stat("fish",5,"Fish caught")],"stone-song":[item("iron",8)],"wild-flowers":[item("flower",6)],
 "animal-friend":[stat("care",12,"Animal care")],"kitchen-stories":[stat("crafted",5,"Recipes made")],"big-little-farm":[{"upgrade":"expansion","amount":1}],
 "moonlit-secret":[item("moonfish",1)],"quay-timber":[item("wood",12),item("copper",4)],"quay-supper":[item("fish_dinner",2)],
 "orchard-preserves":[item("jam",4)],"orchard-flowers":[item("flower",8)],"archive-crystals":[item("crystal",3)],"archive-stew":[item("stew",2)],
 "closer-stories":[stat("bondEvents",2,"Shared moments")],"every-table":[stat("communityEvents",6,"Gatherings joined")],
 "deep-discoveries":[stat("vaults",3,"Instruments recovered")],
 "nora-request-1":[item("feed",12),item("wood",6)],"nora-request-2":[stat("eggs-collected",6,"Fresh eggs collected")],
 "gareth-request-1":[item("wood",20)],"gareth-request-2":[item("stone",10),item("copper",2)],
 "ellis-request-1":[item("wool",4),item("wood",6)],"ellis-request-2":[item("wool",2),item("bouquet",1)],
 "aya-request-1":[stat("letter-deliveries",3,"Letters delivered")],"aya-request-2":[item("soup",1),item("berry",3)],
 "marin-request-1":[item("jam",3)],"marin-request-2":[item("wood",8),item("flower",2)],
 "cato-request-1":[item("carp",3)],"cato-request-2":[stat("harbour-trout",2,"Trout caught at harbour")],
 "nemi-request-1":[item("carrot_seed",4),item("feed",6)],"nemi-request-2":[item("fertilizer",6),item("wood",8)],
 "basil-request-1":[item("iron",6)],"basil-request-2":[stat("cargo-moved",3,"Cargo bays filled")],
 "lyra-request-1":[item("flower",8)],"lyra-request-2":[stat("rest-stop-flowers",3,"Rest stops planted")],
 "pavel-request-1":[item("wood",12),item("stone",4)],"pavel-request-2":[item("cabbage_seed",4),item("cauliflower_seed",4)],
 "ada-request-1":[item("egg",4),item("potato",2)],"ada-request-2":[item("jam",3)],
 "cedar-request-1":[stat("branches-cleared",3,"Branches cleared")],"cedar-request-2":[item("corn",4),item("pumpkin",2)],
 "bea-request-1":[item("mushroom",8),item("berry",4)],"bea-request-2":[item("stew",2)],
 "tobin-request-1":[item("wool",4),item("iron",4)],"tobin-request-2":[item("wood",6),item("stone",6),item("copper",2)],
 "vesper-request-1":[item("wood",12)],"vesper-request-2":[stat("descent-marks",3,"Descent points marked")],
 "jun-request-1":[item("wood",6)],"jun-request-2":[stat("met",25,"People met")],
 "ranger-trail":[stat("trail-markers",4,"Trail markers read")],"reedwater-bridges":[stat("boardwalks",2,"Boardwalk gaps repaired")],
 "cedar-picnic":[item("soup",1),item("bouquet",1)],"quay-cargo":[stat("site:lost-cargo",1,"Labelled crate found")],
 "cliff-lanterns":[stat("lantern-brackets",3,"Brackets repaired")],"quarry-drain":[stat("site:quarry-drain",1,"Drain cleared")],
 "archive-case":[item("wood",10),item("crystal",2)],"winter-rooms":[item("wool",6)],"valley-loop":[stat("outdoor-regions",13,"Outdoor regions visited")],
}
side_finishes={
 "nora":"There, a better start for the small animals. Come back when you need feed or another companion for the barn.",
 "gareth":"I'll put these straight onto the bench. A good repair should still be here after we've forgotten who made it.",
 "ellis":"These will make proper travelling packs. A letter arrives in better shape when the person carrying it does too.",
 "aya":"Another name crossed off the waiting list. People remember when someone makes the trip for them.",
 "marin":"I'll set these aside for the next arrivals. Nobody should have to ask twice for a warm place.",
 "cato":"That will do nicely. The harbour crew will eat well before the next tide.",
 "nemi":"Counted and ready for the cart. I'll keep a place for your next delivery.",
 "basil":"Sound work. It is one less thing to worry about when the weather turns.",
 "lyra":"Come past the planters tomorrow. Small changes can make a street feel cared for.",
 "pavel":"Exactly what the garden needed. You'll see where it went next time you pass.",
 "ada":"Enough for another batch. Stay a moment; there's always room for one more at the kitchen table.",
 "cedar":"I'll tell the orchard crew. They've been waiting for a day when we could finish this properly.",
 "bea":"Thank you. The mountain volunteers can take a proper break now.",
 "tobin":"These will earn their keep. Practical things are the ones people miss most when they fail.",
 "vesper":"The next traveller will have a safer walk. That is a good day's work.",
 "jun":"I've added it to the notes. A map is only useful when someone checks what is actually there.",
 "mira":"Thank you. I'll keep a few packets aside for your next season.","rowan":"The woodland is easier to share when somebody looks after it. Thank you for making the time.",
 "cleo":"I'll put the kettle on. You've earned a place at the table.","finn":"I'll remember that next time I'm out on the water. Come and sit for a while when the rows are done.",
 "orin":"Good work. Let's put it to use while the light is still on the bench.","elias":"One more promise kept. That is how a town grows back together.",
 "sera":"I'll put your farm mark beside this delivery. Thank you for seeing it through.","tamsin":"The table will look a little fuller tomorrow. I hoped it would, and you made it happen.",
 "ilan":"I'll write down what we've learned. The next person should not have to start from a blank page.",
}
for q in catalogue["side"]:
    giver=q["giver"].lower();old=legacy.get(q["id"],{})
    opening=q["objective"].replace(q["giver"]+" needs","I need").replace(q["giver"]+" would like","I'd like").replace("Bring "+q["giver"],"Bring me").replace(q["giver"]+" thinks","I think")
    entries.append({**q,"main":False,"requirements":side_specs[q["id"]],"reward":old.get("reward",{"gold":q.get("rewardGold",450)}),"opening":opening,"completion":side_finishes[giver]})

write("campaign",{"quests":entries,"version":1})
print(f"Authored {len(entries)} native quests with requirements, physical givers, rewards and dialogue.")

# Dialogue is authored speech, not the planning outline. Choices retain stable memory IDs.
bond_speech={
 "mira":[
 ("I keep the grower's name on every packet. If a variety fails, I can ask what happened. If it thrives, I know whom to thank. Would you help with this shelf?", "Spring packets on the left, then. Your grandmother sorted them that way too. I'll leave a space for your first saved seeds.", "These little radishes. Only two gardens still grow them. I'd rather share the packets than let a name vanish from the shelf."),
 ("She used to leave flowers by the well before opening the farm gate. I thought it was for the visitors. Later she told me she liked seeing them herself. What shall we plant?", "Daisies, then. I remember her carrying them in an old flour tin. We can find a better pot, but let's keep that part.", "Something I choose? I'd like the small autumn flowers. It can be a place that remembers her and still changes with us."),
 ("This shelf sticks every time it rains. I've been measuring a bigger seed room, then putting the measurements away. More space means more work. I haven't decided whether I want that.", "Hold the tape there. Knowing the size doesn't mean we have to build it tomorrow. Thank you for letting it be a plan first.", "A room where people can bring seeds of their own. Perhaps I've been planning a bigger shop when I really wanted a shared one."),
 ("The conservatory can hold twelve winter trays. The outer farms need starts, but carrying every tray there would take days. I keep going over the list.", "Then we'll label the outer farms first. I'll ask Aya for room on the cart. It's easier to choose when I know someone will help carry it through.", "A lesson and a handful of seeds for each house. That would last longer than our twelve trays. Will you help me write the first growing notes?"),
 ("People have asked about a spring seed exchange. I said I'd think about a place. I was really wondering whether we might make it something we do together.", "At the farm? I'd like that. We can put the packets on the long bench and keep the kitchen free for anyone who needs warmth.", "A shared corner beside the seedhouse would be lovely. Somewhere neither of us has to own alone. Let's measure it after closing."),
 ("I made two lists for next spring: the seedhouse, and the garden I'd like to grow with you. I don't want either list to swallow the other. Is there room for both?", "Then let's draw the paths before the beds. I'd like a place we can return to, even on days when all we have time for is watering.", "Yes. Your rows, my trials, and a table between them. Sharing a future shouldn't mean becoming the same person."),
 ],
 "rowan":[
 ("See the cut on that post? One mark means a clear trail. Two means a return route nearby. I check them after every storm. People stop noticing a safe path; that's usually a good sign.", "Good. We'll take the short loop and come back before dark. You don't have to keep up with anyone else's pace.", "The northern turn needs clearing. I'll show you the roots before we start. Another pair of hands helps most when both people get home safely."),
 ("The shelter still has a dry bench. Its roof needs work, and the path has almost disappeared. I used to come here when I needed an hour without being useful to anyone.", "I'll brace it while you fasten the new piece. Perhaps when we're done, we can sit here without inventing another job.", "A clear path first. You're right; a shelter nobody can reach isn't much comfort. We'll leave the old roots where they are."),
 ("Three branches came down in last night's rain. We could force the side trail open, or let it rest and use the ridge. I don't like cutting a living tree to save ten minutes.", "The main trail will carry everyone for now. I'll put the detour mark where it can be seen. Thank you for thinking about the people after us.", "Let's take the ridge. Some repairs are better made by leaving enough space. I like that you saw the trees before the delay."),
 ("I was offered a post beyond the coast. Better pay, a room above the station. I came back here instead. I've never been very good at explaining that decision.", "My father couldn't walk the long trail anymore. I wanted there to be someone who knew where he might stop. Then I realised I wanted to stay for myself too.", "A beginning, perhaps? That was what I wanted when I came home. Hearing you say it makes this feel less like the place people return to after failing."),
 ("Your harvest doesn't move for my patrol, and the weather doesn't move for either of us. I want to see you more often. I'd rather make a small promise I can keep.", "One evening each week. I'll finish the shorter loop that day. If the weather changes it, I'll tell you instead of simply not arriving.", "Come when the rows are done. We can carry a supper and take the sheltered route. I don't need every evening; I want the ones we choose."),
 ("This turn is where the cabin path meets your farm road. I've walked it alone for years. I'd like that to change, without asking either of us to leave our work behind.", "We'll keep the old loop clear. And when it doesn't need us, we'll walk it anyway. I think that's a promise worth making.", "A path between the cabin and farm. Not a grand project, just a way of making it easier to keep coming back to each other."),
 ],
 "cleo":[
 ("Before the first customer, I chop the vegetables, set four tables, and forget my own breakfast. You arrived at exactly the right time to catch me doing the third thing.", "Take the carrots. I'll find another knife, and two bowls for us. Work is better company when breakfast is part of it.", "The window table first, please. Then sit at it. I can accept help without making you work through your whole morning."),
 ("Mrs Vale can't manage the hill now. I thought of sending a meal, then wondered if she misses the room more than the food. There's a difference, isn't there?", "A thick soup will travel well. We can include a note asking when she'd like company. Help should leave people a choice.", "I'll open the back room before the rush. We can bring her up slowly and give her the window table. Thank you for thinking of the person before the basket."),
 ("My father wrote this recipe on a receipt. I've changed the herbs three times, but I still make his version when I'm tired. I used to think changing it meant losing him.", "Let's make his version today. Keeping something can be a choice, too. Tomorrow I might feel brave enough for the new herbs.", "Then taste this before I add the last pinch. If it works, I'll write my name under his. There's room on the back of the receipt."),
 ("I can handle a full room. It's the moment everyone leaves that catches me: plates, accounts, tomorrow's dough. Sometimes I need help before I remember to ask.", "Thank you. I'll finish the accounts while you wash, and then we both stop. Neither of us has to earn the right to rest tonight.", "Would you stack the clean bowls? The noise of the washing can wait. I wanted someone beside me more than I wanted a faster kitchen."),
 ("The deliveries are counted. The next batch can wait twenty minutes. I made breakfast for two and, for once, neither plate is for a customer.", "Closed, then. Tell me something about your morning that has nothing to do with crop prices. I'll try to do the same.", "One afternoon closed each week. I've written it down and crossed it out twice. Perhaps the first step is leaving it on the page."),
 ("I drew next season's menu around what your farm can grow. Then I started drawing a kitchen beside it. I should ask before I turn our future into another work list.", "We'll plan the beds, and leave some rows for surprises. I'd like to cook what you grow, and also have evenings when neither of us has to produce anything.", "A kitchen with a table we actually sit at. Yes. I want a home with you, not a second café. Let's keep that in the drawing."),
 ],
 "finn":[
 ("Don't cast yet. Watch where the water folds near that stone. Fish spend less energy there. Most of fishing is learning when to leave things alone.", "There. You saw it before I pointed. We'll cast once, then let the water settle. There's no prize for making the most splashes.", "The dark line is the fast current; the still edge is where we want to be. Come closer. I'll show you without throwing another stone."),
 ("I fixed the loose plank. We could go fishing, but I brought nothing to prove today. Would you sit a while? The bridge is good for that too.", "Thank you. Some days I can hear myself think better when someone is there without expecting a story.", "I wondered how the first week felt from your side of the hill. Tell me. The fish will still be here another evening."),
 ("I've worked three coasts and never kept a room long. Here, I know where the rain collects on the path. It's a strange thing to call home, isn't it?", "This shore, I think. Not because it's the prettiest. Because someone notices when I don't come back along it.", "Lead the way. I'd like to know what you stop to look at when nobody is waiting for you. Perhaps next time I'll recognise the place myself."),
 ("I kept enough of the catch for two. Usually I give the last fish away and call it supper. I wanted to make an evening of it this time.", "You prepare the vegetables; I'll clean the fish. It feels different making something we both intend to stay for.", "Your kitchen would be good. I'll bring the fish and wash the pan. I'd like to learn which cupboard holds the bowls without asking every time."),
 ("The boat is ready whenever I need it because I mend things before they fail. I'm less good at doing that with plans. I don't want to drift through this with you.", "Then we'll check it together after the weekly catch. A small routine. I think I could build a life out of those.", "A list would help. Put time together on it too, before I fill every line with rope and paint. I mean that."),
 ("I've been thinking about where to leave the boat in winter. The practical question became a different one: where I'd like to come home to afterwards.", "The shore walk, every week we can. And when we can't, we tell each other. I want something that lasts through ordinary weather.", "I would like that. After the season, with room for both our work. It feels good to say it plainly instead of hoping the tide will carry us there."),
 ],
 "sera":[
 ("The timber looks identical until a boat needs a curved rib and gets a straight board. These labels save days of arguing with wood. Will you help me finish the ledger?", "Destination first. Good. The inland houses get the shorter lengths; the landing crew needs the long ones. I'll keep your farm mark on the new page.", "A family at the ridge, the orchard pantry, and Basil's crew. It is easier to finish a list when it sounds like people."),
 ("That final plank used to feel like the end. Now I look at the empty hold and think about everything the boat is supposed to carry. Hold this end for me?", "Steady there. Yes, that's the line. A sound hull is a small beginning, but I'd rather make it beside someone who stays for the hard part.", "The crates fit with space for a dry passage. You thought of the person unloading them. I like the way you work."),
 ("We could launch now, or wait for the turn. I used to call waiting a failure. Basil says a boat that arrives tomorrow is better than a promise that sinks today.", "We'll wait. I'll put the kettle on and stop pretending I can hurry the sea. Thank you for making caution feel like a shared decision.", "The landing ropes need checking. We can use the hour well without pretending the tide has changed. I'll take the upper steps with you."),
 ("The first local load is small on purpose. A short crossing, known weather, two people who know the way back. Which part would you like to own?", "You keep the list; I'll take the lines. If something doesn't match, we stop together. I don't need you to agree with me just because it's my boat.", "Then we'll unload side by side. I want this to be something we make work, not a journey where you wait for me to finish."),
 ("I cleared that corner twice and filled it with spare ribs twice. I said there wasn't space for another bench. I think I was avoiding what the space was for.", "Bring the bench. I'll clear the ribs properly this time. A place for you should be more than the bit of floor I haven't used yet.", "I'd like the benches facing the same window. We could work on separate things and still share the afternoon. Thank you for asking."),
 ("The winter runs will take me away for days. I want a home with you, and I won't pretend the harbour stops needing me. Can we plan for both?", "A day after each return, before I take another order. I can keep that promise if I make it part of the schedule now.", "Yes. Put both lists on the table. The farm and the harbour brought us together; they shouldn't become things we hide from each other."),
 ],
 "tamsin":[
 ("The oldest trees flower last. Every spring someone asks if they're dying, and every spring they make the best fruit. I still check them, though. Hope isn't the same as looking closely.", "Come along this row. The bark is rough, but the new shoots are sound. I'll show you the cut that tells us when to stop pruning.", "The new rows need the most attention. Hold this stake while I tie it loosely. Trees grow better with support that leaves room."),
 ("I kept these blankets even when nobody came to the orchard table. Folding them was easier than admitting I'd stopped expecting visitors. Today I counted enough for everyone.", "The blue ones along this side. We can sit at the end when the plates are full. I'd like to remember the table with you in it.", "Ada hasn't stayed for a meal in years. Let's ask without making her explain why she stayed away. There's a place ready if she wants it."),
 ("I lost a whole batch the first year I ran the presshouse. Too much heat, too much pride to ask for help. I still smell that burnt pan when I'm tired.", "That a season isn't ruined by one pan. And that asking early costs less than starting over alone. I wish I'd learned the second part sooner.", "You too? Tell me while we stir. Perhaps the next batch will taste better if we stop keeping a tally of our worst mornings."),
 ("Everyone arrived at once, then Cedar brought two people nobody expected. I used to worry about making the table look complete. Now I'm glad we left a gap.", "An extra place, always. Even if nobody takes it today, it says something about the room. I'll remember that when I lay the next table.", "Come with me. We can make arriving late feel like arriving, instead of apologising. I'm glad you're here for this part."),
 ("Winter makes me plan too much. New beds, repaired glass, another pantry shelf. Then I realise I haven't left an afternoon that belongs to us.", "We'll repair what is needed and leave the rest for spring. I don't want to build a future that we're too tired to live in.", "Let's put rest on the calendar first. Then the beds. It's a little frightening to leave work unfinished, but less so with you beside me."),
 ("I want to grow old trees here. I want a life with you too. For a long time I treated those as two plans that might not fit on the same piece of ground.", "One new row together. We'll choose trees that will still be here long after the first harvest. I like the patience in that promise.", "A shared home, two gardens, and paths between them. Yes. We can belong together without giving up the places that taught us who we are."),
 ],
}
bond_areas={"mira":["market"]*6,"rowan":["ranger-house"]*6,"cleo":["cafe"]*6,"finn":["lake-house"]*6,"sera":["quay-workshop"]*6,"tamsin":["orchard-house"]*6}
room_names={r["id"]:r["name"] for r in read(PLAN,"interiors")}
scenes=[]
for b in read(PLAN,"bonds"):
    p=b["person"];i=b["chapter"]-1;line,r0,r1=bond_speech[p][i];area=bond_areas[p][i]
    scenes.append({**b,"area":area,"place":room_names.get(area,area),"line":line,"responses":[r0,r1]})
write("bond-scenes",scenes)

def control(label, states): return {"label":label,"states":states}
def puzzle(area, name, kind, hint, controls, target, success):
    return {"area":area,"name":name,"kind":kind,"hint":hint,"controls":controls,"target":target,"success":success}
write("vault-puzzles",[
 puzzle("tide-vault-2","The intake wheel","combination","The maintenance plate shows: side channel, then release the intake. Keep the archive pipe closed.",[control("Diverter",["Archive pipe","Closed","Side channel"]),control("Intake brake",["Held","Released"])],[2,1],"Water settles into the side channel. The maintenance gate is raised."),
 puzzle("tide-vault-3","The loaded carts","combination","A floor sketch marks the heavy cart at rail position 2, and the light cart at position 1. Carts stay on their rails.",[control("Heavy cart",["Bay 0","Bay 1","Bay 2","Bay 3"]),control("Light cart",["Bay 0","Bay 1","Bay 2","Bay 3"])],[2,1],"Both plates settle. The counterweight lifts the archive grille."),
 puzzle("tide-vault-4","The three sluices","combination","The pump diagram has two open branches around a closed centre: open, closed, open. A wrong release drains only this lock.",[control("West sluice",["Closed","Open"]),control("Centre sluice",["Closed","Open"]),control("East sluice",["Closed","Open"])],[1,0,1],"The salt lock drains. A dry passage leads to the chart room."),
 puzzle("ember-vault-2","The freight balance","combination","The maker's scale reads: two blocks left, one block right. The lift stays parked until the load is balanced.",[control("Left ballast",["Empty","One block","Two blocks","Three blocks"]),control("Right ballast",["Empty","One block","Two blocks","Three blocks"])],[2,1],"The lift rises evenly. Its brake locks onto the upper landing."),
 puzzle("ember-vault-3","The cooling ducts","sequence","Follow the numbered workshop plates: east vent, north vent, west vent. A wrong vent resets the sequence safely.",[control("West vent",["Pull"]),control("North vent",["Pull"]),control("East vent",["Pull"])],[2,1,0],"Cool air crosses the floor. The insulated shutter is safe to approach."),
 puzzle("ember-vault-4","The reflector rail","combination","The rail mark is 1. Face the reflector west. Its beam must meet the shutter sensor, never the wrapped lens.",[control("Rail position",["Mark 0","Mark 1","Mark 2","Mark 3"]),control("Reflector",["North","East","South","West"])],[1,3],"The sensor warms and the storage shutter slides aside."),
 puzzle("sky-vault-2","The wind shutters","combination","The sheltered crossing is marked: west half open, east fully open. Wait for the blue wind ribbons before crossing.",[control("West shutter",["Closed","Half open","Open"]),control("East shutter",["Closed","Half open","Open"])],[1,2],"The wind takes the upper channel. The gallery crossing is sheltered."),
 puzzle("sky-vault-3","The captive gears","combination","The large gear seats at notch 2; the small gear at notch 3. Both remain captive on the work rails.",[control("Large gear",["Notch 0","Notch 1","Notch 2","Notch 3"]),control("Small gear",["Notch 0","Notch 1","Notch 2","Notch 3"])],[2,3],"The gears mesh without strain. The meridian platform unlocks."),
 puzzle("sky-vault-4","The meridian plates","sequence","The survey note reads north, west, east. Touch each fixed plate in that order; the escape stair is independent.",[control("North plate",["Align"]),control("East plate",["Align"]),control("West plate",["Align"])],[0,2,1],"The meridian marks align. The compass gallery opens to the morning sky."),
])
print(f"Authored {len(scenes)} spoken bond scenes and 9 persistent room puzzles.")

sites=[]
def site(id,area,x,y,label,copy,stat_key=None,materials=None,requires=None,energy=0,frame="room/table"):
    sites.append({"id":id,"area":area,"position":[x,y],"label":label,"copy":copy,"stat":stat_key or "site:"+id,"materials":materials or {},"requires":requires,"energy":energy,"frame":frame})
site("quay-ledger","quay-workshop",6,22,"Delivery ledger","Four destinations share the same farm mark. Coastal grain, orchard preserves, archive supplies, and a warm room at each end.",requires="letters-across-water")
site("weather-bench","forge",15,22,"Weather bench","Fit a copper frame and a clear crystal mount. The lens stays in your atlas satchel.",materials={"copper":2,"crystal":1},requires="weather-not-wishes")
for area,x,y,person in [("market",6,21,"mira"),("quay-inn",6,22,"marin"),("library",6,22,"ilan")]:
    site("letter-"+person,area,x,18 if person!="mira" else y,"Courier pouch","Aya's sealed letter is addressed here. Leave it in the recipient's delivery tray.","letter-deliveries",requires="aya-request-1",frame="room/bin")
for i in range(3):
    site(f"cargo-{i}","quay-storehouse",6+i*4,19,"Cargo bay "+str(i+1),"Roll the marked cargo into its matching bay. The guide rails keep the load away from the doorway.","cargo-moved",requires="basil-request-2",energy=2,frame="room/bin")
    site(f"flowers-{i}",["cedar-downs","saltwind-cliffs","observatory-rise"][i],36,68,"Rest-stop planter","A sheltered bench, a drinking jar, and room for flowers. Place one bouquet here.","rest-stop-flowers",{"bouquet":1},"lyra-request-2",frame="room/plant")
    site(f"branch-{i}","cedar-downs",46+i*12,60+i%2*10,"Fallen branch","Cut and stack this fallen branch beside the path, leaving the new shoots intact.","branches-cleared",requires="cedar-request-1",energy=2,frame="room/logpile")
    site(f"descent-{i}","observatory-rise",38+i*8,78+i*16,"Descent marker","Check the sheltered return line, then turn the fixed marker towards the next dry landing.","descent-marks",requires="vesper-request-2",frame="rock_21")
    site(f"survey-{i}","observatory-rise",66,50+i*26,"Route survey "+str(i+1),["Slope checked: the cart can climb without crossing loose ground.","Shelter checked: the landing stays dry in an eastern squall.","Return checked: the descent reaches the lodge before dusk."][i],"route-checks",requires="the-winter-trial",frame="room/pebbles-a")
    site(f"bracket-{i}","saltwind-cliffs",34+i*28,68,"Landing lantern bracket","Refasten the fixed light bracket with copper and timber. It will mark the stair in poor weather.","lantern-brackets",{"wood":2,"copper":1},"cliff-lanterns",frame="room/lamp")
for i in range(4):site(f"trail-{i}","forest",32+i*23,72+i%2*13,"Ranger's trail mark","One cut means the trail continues. Two cuts mark a return loop. Compare this post with Rowan's route notes.","trail-markers",requires="ranger-trail",frame="room/stump")
for i in range(2):site(f"boardwalk-{i}","reedwater-marsh",48+i*38,64,"Boardwalk repair","Six timber will replace the loose boardwalk section. The main bank path stays open during repairs.","boardwalks",{"wood":6},"reedwater-bridges",frame="room/logpile")
site("lost-cargo","quay-storehouse",14,24,"Misplaced parcel","The worn label has Basil's pier number. Move this parcel to the dry pickup bay.",requires="quay-cargo",frame="room/bin")
site("quarry-drain","ember-trail",55,57,"Quarry drain","Clear the stone and sweep the narrow channel. Water can leave the quarry without crossing the footpath.",requires="quarry-drain",energy=4,frame="rock_36")
for id,area in [("village","community-kitchen"),("quay","quay-inn"),("orchard","presshouse"),("archive","library")]:
    site("shared-room-"+id,area,6,24,"Shared-room repair","Replace the broken fittings, open the shutters, and set the room for travellers. Materials: six timber and four stone.","public-rooms",{"wood":6,"stone":4},"four-open-doors",frame="room/bin")
for i,(name,goods) in enumerate([("Pantry box",{"soup":2,"egg":3}),("Orchard box",{"jam":2,"corn":3}),("Repair box",{"wood":12,"iron":2})]):
    site("convoy-"+str(i),"farm",54.7,40,name,"Pack and label this delivery at the homestead shipping crate. Aya collects all three boxes at dawn.","convoy-packed",goods,"first-convoy",frame="room/bin")
write("worksites",sites)
print(f"Authored {len(sites)} physical work sites.")

event_goods={
 "blossom-picnic":({"flower":3},{"bouquet":1},"Lay flowers by the garden's first shared meal."),
 "lakefire-evening":({"carp":2},{"fish_dinner":1},"Prepare the evening catch by the lake."),
 "harvest-gathering":({"corn":3},{"jam":2},"Add fresh corn to the orchard harvest baskets."),
 "starlight-night":({"soup":2},{"wool":2},"Carry warm bowls to the archive's sheltered walk."),
 "seed-exchange":({"turnip_seed":3},{"carrot_seed":4},"Exchange three turnip packets for four carrot packets."),
 "harbour-opening":({"wood":6},{"copper":3},"Help fit out the first spring delivery boat."),
 "quay-supper":({"trout":1},{"fish_dinner":2},"Prepare a harbour supper from the day's catch."),
 "glasshouse-open-day":({"fertilizer":2},{"cauliflower_seed":4},"Tend the public seed beds and take home a spring variety."),
 "presshouse-day":({"berry":4},{"jam":2},"Help turn the last summer berries into preserves."),
 "mapmakers-walk":({"flower":2},{"crystal":1},"Walk the archive route and leave flowers at the sheltered rest stop."),
 "winter-delivery":({"soup":2},{"feed":8},"Pack warm food for the outer farms' winter cart."),
 "lowlight-evening":({"copper":2},{"stew":2},"Repair the fixed lantern brackets before the harbour meal."),
}
activities=[]
for e in catalogue["events"]:
    consume,produce,copy=event_goods[e["id"]]
    activities.append({**e,"from":960,"to":1200,"consume":consume,"produce":produce,"activity":copy})
write("calendar-activities",activities)
