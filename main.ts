import * as fs from 'node:fs';
import * as path from 'node:path';
import * as zlib from 'node:zlib';

const W = 900, H = 1024;
const bg = [10,10,10], ink = [232,236,230], muted = [145,155,148], accent = [60,210,150];
const grid: Record<string, string[]> = {
  'A':['00000','01110','10001','10001','11111','10001','10001'],
  'B':['11110','10001','10001','11110','10001','10001','11110'],
  'C':['01111','10000','10000','10000','10000','10000','01111'],
  'D':['11110','10001','10001','10001','10001','10001','11110'],
  'E':['11111','10000','10000','11110','10000','10000','11111'],
  'F':['11111','10000','10000','11110','10000','10000','10000'],
  'G':['01111','10000','10000','10111','10001','10001','01111'],
  'H':['10001','10001','10001','11111','10001','10001','10001'],
  'I':['11111','00100','00100','00100','00100','00100','11111'],
  'J':['00111','00010','00010','00010','10010','10010','01100'],
  'K':['10001','10010','10100','11000','10100','10010','10001'],
  'L':['10000','10000','10000','10000','10000','10000','11111'],
  'M':['10001','11011','10101','10101','10001','10001','10001'],
  'N':['10001','11001','10101','10011','10001','10001','10001'],
  'O':['01110','10001','10001','10001','10001','10001','01110'],
  'P':['11110','10001','10001','11110','10000','10000','10000'],
  'Q':['01110','10001','10001','10001','10101','10010','01101'],
  'R':['11110','10001','10001','11110','10100','10010','10001'],
  'S':['01111','10000','10000','01110','00001','00001','11110'],
  'T':['11111','00100','00100','00100','00100','00100','00100'],
  'U':['10001','10001','10001','10001','10001','10001','01110'],
  'V':['10001','10001','10001','10001','10001','01010','00100'],
  'W':['10001','10001','10001','10101','10101','11011','10001'],
  'X':['10001','10001','01010','00100','01010','10001','10001'],
  'Y':['10001','10001','01010','00100','00100','00100','00100'],
  'Z':['11111','00001','00010','00100','01000','10000','11111'],
  '0':['01110','10001','10011','10101','11001','10001','01110'],
  '1':['00100','01100','00100','00100','00100','00100','01110'],
  '2':['01110','10001','00001','00010','00100','01000','11111'],
  '3':['11110','00001','00001','01110','00001','00001','11110'],
  '4':['00010','00110','01010','10010','11111','00010','00010'],
  '5':['11111','10000','10000','11110','00001','00001','11110'],
  '6':['01110','10000','10000','11110','10001','10001','01110'],
  '7':['11111','00001','00010','00100','01000','01000','01000'],
  '8':['01110','10001','10001','01110','10001','10001','01110'],
  '9':['01110','10001','10001','01111','00001','00001','01110'],
  '-':['00000','00000','00000','11111','00000','00000','00000'],
  '/':['00001','00010','00010','00100','01000','01000','10000'],
  ':':['00000','00100','00100','00000','00100','00100','00000'],
  '.':['00000','00000','00000','00000','00000','00110','00110']
};
const pix = Buffer.alloc(W*H*3); for(let i=0;i<pix.length;i+=3){pix[i]=bg[0];pix[i+1]=bg[1];pix[i+2]=bg[2];}
function rect(x:number,y:number,w:number,h:number,c:number[]){for(let yy=Math.max(0,y);yy<Math.min(H,y+h);yy++)for(let xx=Math.max(0,x);xx<Math.min(W,x+w);xx++){let i=(yy*W+xx)*3;pix[i]=c[0];pix[i+1]=c[1];pix[i+2]=c[2];}}
function text(s:string,x:number,y:number,scale:number,c:number[],limit=999){let xx=x;for(const ch of s.slice(0,limit)){if(ch===' '){xx+=6*scale;continue;}const g=grid[ch]||grid['-'];for(let r=0;r<7;r++)for(let q=0;q<5;q++)if(g[r][q]==='1')rect(xx+q*scale,y+r*scale,scale,scale,c);xx+=6*scale;}}
function rule(x:number,y:number,w:number){rect(x,y,w,1,accent);}
function icon(kind:number,x:number,y:number){if(kind===0){rect(x+18,y+10,70,4,accent);rect(x+50,y+14,4,50,accent);rect(x+25,y+64,54,4,accent);rect(x+30,y+70,8,20,muted);rect(x+66,y+70,8,20,muted);}if(kind===1){for(let i=0;i<5;i++)rect(x+12+i*14,y+18-i*3,7,45+i*3,accent);rect(x+8,y+68,74,3,muted);}if(kind===2){rect(x+12,y+12,68,52,muted);rect(x+24,y+25,44,26,bg);rect(x+30,y+30,32,4,accent);rect(x+30,y+42,24,4,accent);}if(kind===3){rect(x+45,y+8,4,72,accent);rect(x+12,y+40,70,4,accent);rect(x+20,y+18,8,8,muted);rect(x+65,y+58,8,8,muted);}if(kind===4){for(let i=0;i<4;i++)rect(x+15+i*17,y+20+i*7,8,45-i*7,accent);rect(x+12,y+68,70,3,muted);}if(kind===5){rect(x+20,y+12,50,52,accent);rect(x+10,y+28,70,8,muted);rect(x+38,y+5,14,14,accent);rect(x+28,y+72,34,4,muted);}}
const stories = [
 ['SHENZHEN / CHINA','TRUMP XI PUTIN','HOLD SUMMIT','NUCLEAR TALKS','3 LEADERS / APEC','WARS AND TRADE ON THE AGENDA'],
 ['RIYADH / SAUDI ARABIA','MISSILE DEBRIS','HITS CAPITAL','DAMAGE REPORTED','SAUDI-LED COALITION SAYS','HOUTHI THREAT / DAMAGE ASSESSED'],
 ['FRANCE / HEALTH','BIRD FLU ALERT','AT MAXIMUM','RESTRICTIONS SET','ANNOUNCED TODAY / START FRIDAY','POULTRY TO BE CONFINED'],
 ['BANGLADESH / UNREST','HASINA BACKERS','ENFORCE STRIKE','VIOLENCE RISES','97 BORDER GUARD PLATOONS SENT','DEPLOYED ACROSS 7 DISTRICTS'],
 ['ANTALYA / TURKEY','COP31 PUSHES','ENERGY TARGET','NOT YET A DEAL','ELECTRICITY / 35 PCT BY 2035','22 PCT NOW / GLOBAL ENERGY USE'],
 ['MRIMA HILL / KENYA','US GROUP WINS','MINERALS BID','RARE EARTHS','7 BIDDERS SHORTLISTED IN JULY','LICENCES STILL REQUIRED']
];
text('WORLD NEWS',42,28,5,ink); text('THURSDAY 19 NOVEMBER 2026',44,66,3,accent); text('SIX STORIES / ONE DAY / MANY FRONTS',44,91,2,muted); rule(42,112,816);
const pw=408, ph=260, gapx=24, gapy=18, top=136;
for(let n=0;n<6;n++){const col=n%2,row=Math.floor(n/2),x=42+col*(pw+gapx),y=top+row*(ph+gapy);rect(x,y,pw,ph,[22,27,25]);rect(x,y,pw,2,accent);rect(x,y,2,ph,accent);text(String(n+1).padStart(2,'0'),x+16,y+15,2,accent);text(stories[n][0],x+58,y+17,2,muted);rect(x+pw-20,y+16,4,18,accent);rule(x+16,y+48,pw-32);text(stories[n][1],x+16,y+66,3,ink);text(stories[n][2],x+16,y+94,3,ink);text(stories[n][3],x+16,y+122,3,ink);rule(x+16,y+156,pw-32);text(stories[n][4],x+16,y+174,2,accent);text(stories[n][5],x+16,y+201,2,muted);}
text('19 NOV 2026 / REPORTING SNAPSHOT / REUTERS AND AP',42,962,2,muted); rule(42,983,816);
function crc32(b:Buffer){let t=0xffffffff;for(const v of b){t^=v;for(let k=0;k<8;k++)t=(t>>>1)^((t&1)?0xedb88320:0);}return (t^0xffffffff)>>>0;}
function chunk(type:string,data:Buffer){const t=Buffer.from(type);const out=Buffer.alloc(12+data.length);out.writeUInt32BE(data.length,0);t.copy(out,4);data.copy(out,8);out.writeUInt32BE(crc32(Buffer.concat([t,data])),8+data.length);return out;}
const raw=Buffer.alloc(H*(1+W*3));for(let y=0;y<H;y++){raw[y*(1+W*3)]=0;pix.copy(raw,y*(1+W*3)+1,y*W*3,(y+1)*W*3);}
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',Buffer.from([0,0,3,132,0,0,4,0,8,2,0,0,0])),chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
const out=process.env.MAKEFUN_OUTPUT_DIR||'/output';fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'entry.png'),png);
