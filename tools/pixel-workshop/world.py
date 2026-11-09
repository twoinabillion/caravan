"""Editable world seed extracted from the approved pixel journey study. No file I/O."""
from pathlib import Path
import random,json

r=random.Random(66)
def rect(x,y,w,h,c,extra=''):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{c}" {extra}/>'
sky=''.join(rect(r.randrange(8,234),r.randrange(4,59),1,1,r.choice(['#8b9d99','#667e80','#455f67'])) for _ in range(47))
mountains='<path d="M0 73V60H9V57H17V53H28V49H36V53H44V60H57V63H66V57H75V52H84V49H94V54H105V59H115V63H130V57H138V54H147V49H160V53H173V56H185V51H192V47H207V54H216V60H232V65H240V88H0" fill="#263e46"/><path d="M0 85V71H14V67H24V72H42V75H55V69H71V66H86V74H111V72H133V68H145V65H161V71H179V76H201V68H214V65H227V72H240V91H0" fill="#263d3d"/>'
trees=''
for x,y,s in [(5,84,1),(25,91,1.3),(54,86,.85),(76,86,.7),(225,85,1.2),(239,98,1.5)]:
 trees+=f'<g transform="translate({x} {y}) scale({s})">'+rect(-1,-31,2,34,'#172e30')+'<path d="M-3-35H3V-30H6V-26H9V-23H4V-20H10V-16H13V-12H6V-9H15V-5H5V0H-5V-5H-15V-9H-6V-12H-13V-16H-10V-20H-4V-23H-9V-26H-6V-30H-3Z" fill="#1a3434"/></g>'
ground=rect(0,95,240,49,'#253b35')+rect(0,107,240,37,'#293e33')
for i in range(160):
 x,y=r.randrange(240),r.randrange(97,144);ground+=rect(x,y,r.choice([1,2,3,5]),1,r.choice(['#31473a','#344939','#22362f','#394d3d']))
van=rect(82,117,140,4,'#142b28')+rect(85,54,92,54,'#797b68')+rect(88,57,86,47,'#92917a')+rect(88,57,86,3,'#b0a58a')+rect(86,91,90,3,'#676d5c')+rect(86,104,91,6,'#4c5b50')+rect(87,59,2,42,'#525f52')
# Rear doors and worn side boards.
van+=rect(90,63,10,35,'#757c68')+rect(94,63,1,35,'#4e5c51')+rect(91,79,2,2,'#c0ad7c')
for x in [104,134]:
 van+=rect(x-2,65,20,22,'#505c50')+rect(x,67,16,17,'#c49a55')+rect(x+2,69,12,13,'#e6b66b')+rect(x+7,67,1,17,'#776d4d')+rect(x,82,16,2,'#a38751')
van+=rect(162,66,9,21,'#6c7765')+rect(164,68,5,17,'#3b524f')
for i in range(33):
 x,y=r.randrange(100,171),r.randrange(57,103);van+=rect(x,y,r.choice([1,2,3]),1,r.choice(['#787e67','#a29b7e','#646e5c']))
van+=rect(100,45,47,10,'#394d43')+rect(104,43,19,3,'#4d5c4c')+rect(109,45,1,10,'#8f8d68')+rect(133,44,1,11,'#8f8d68')
for x in [151,161]:van+=rect(x,43,8,12,'#7e4838')+rect(x+2,41,4,2,'#b18b59')+rect(x+2,46,1,7,'#a36142')
van+=rect(84,53,94,2,'#475b4b')+rect(175,36,1,19,'#263f37')+rect(174,35,3,1,'#738370')
# Korean cab-over, canonical grey-beige body, faded white X.
van+='<path d="M177 73H198V76H203V81H208V90H215V108H177Z" fill="#858773"/><path d="M180 77H196V80H201V88H180Z" fill="#354e52"/>'+rect(181,78,10,1,'#5b7170')+rect(197,81,2,6,'#698080')+rect(177,92,36,2,'#a49d7d')+rect(180,94,17,13,'#7b816c')+rect(180,91,2,3,'#414e43')+rect(183,94,3,1,'#485749')+rect(207,94,6,3,'#dfbc77')+rect(208,101,6,5,'#505e50')+rect(213,104,4,5,'#334a3e')+rect(86,102,2,5,'#9e4c38')
van+='<path d="M183 98H185V100H187V102H189V104H187V102H185V104H183V102H185V100H183Z" fill="#c4c1a0"/>'
for x in [106,201]:
 van+='<g>'+rect(x-8,106,16,13,'#142b29')+rect(x-6,103,12,19,'#142b29')+rect(x-8,108,16,9,'#172d2b')+rect(x-5,106,10,13,'#293d35')+rect(x-3,109,6,7,'#526451')+rect(x-1,111,2,3,'#7d8464')+rect(x-6,106,2,2,'#374b3e')+'</g>'
# Open maintenance access above the front wheel.
van+=rect(196,96,9,8,'#203831')+rect(198,98,5,4,'#485a47')+rect(200,100,2,2,'#afad82')+rect(196,94,10,2,'#ac9e76')
# Portable work lamp and toolkit, independent of the character.
lamp=rect(218,108,2,22,'#142f2a')+rect(215,130,8,2,'#1b332b')+rect(215,104,8,6,'#6e7455')+rect(216,105,6,3,'#eed18b')+'<path d="M216 109L192 124H225L222 109Z" fill="#e7bb64" opacity=".07"/>'
box=rect(155,124,16,7,'#3d5443')+rect(155,124,16,2,'#8e8961')+rect(160,122,6,2,'#263e32')+rect(162,127,2,2,'#b5a46c')
