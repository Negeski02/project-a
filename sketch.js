// ── ELASTIC POINT ────────────────────────────
let ex, ey, ecx, ecy;
let Dmp = 0, edx = 0, edy = 0, md = 0;
let sft = 0.01, elast = 0.3, bt = 0.05;

// ── CAT'S CRADLE ──────────────────────────────
let a0x=0,a1x=0,a2x=0,a3x=0,a4x=0,a5x=0;
let a0y=0,a1y=0,a2y=0,a3y=0,a4y=0,a5y=0;
let a0bx=0,a1bx=0,a2bx=0,a3bx=0,a4bx=0,a5bx=0;
let a0by=0,a1by=0,a2by=0,a3by=0,a4by=0,a5by=0;
let n0x=0,n1x=0,n2x=0,n3x=0,n4x=0,n5x=0;
let n0y=0,n1y=0,n2y=0,n3y=0,n4y=0,n5y=0;

// ── CREATURE ──────────────────────────────────
let t = 0;

let coreSize = 38;
let limbLen = 80, limbThick = 14, limbAngle = 0, limbOffset = 0;
let antLen = 55, antAngle = 0;
let tailLen = 70, tailThick = 12, tailAngle = 0;

let phaseCore=0, phaseLimb=0, phaseAnt=0, phaseTail=0;
let breathCore=1, breathLimb=1, breathAnt=1, breathTail=1;
let sniffOffset=0;

// ── INVOLUNTARY MOTION ────────────────────────
let bodyAngVel=0, bodyAng=0;
let limbAngVel=0, limbAng=0;
let tailAngVel=0, tailAng=0;
let antAngVel=0,  antAng=0;

// impulse timers in frames
let impBodyNext=0, impLimbNext=0, impTailNext=0, impAntNext=0;
let jitterAmt=0;

// state: 0=idle 1=alert 2=twitch
let crState=0, crStateTimer=0;

let headX=0, headY=0, headVX=0, headVY=0;

// blink
let blinkTimer=0, blinkInterval=180, blinkOn=false, blinkDur=0;

// ── DISINTEGRATION ────────────────────────────
let isHolding=false, holdStart=0;
let HOLD_FRAMES=30; // ~500ms a 60fps
let disintegrated=false, disintAt=0, returning=false;
let looseX=0, looseY=0, looseVX=0, looseVY=0;
let looseRot=0, looseRotSpd=0, looseGrav=0.12;
let looseBounces=0, looseSettled=false;

// ── SCALE AND MORPH ───────────────────────────
let crScale=1;
let morphTimer=0;
let MORPH_FRAMES=180; // 3s a 60fps

// ── SETUP ─────────────────────────────────────
function setup() {
    let canvas = createCanvas(800, 500);
    canvas.parent("p5-canvas-container");
  angleMode(DEGREES);
  ecx = width/2;
  ecy = height/2;
  ex = ecx; ey = ecy;
  initCreature();
  initSticks();
}

function initCreature() {
  coreSize   = random(28, 52);
  limbLen    = random(50, 110);
  limbThick  = random(8, 22);
  limbAngle  = random(360);
  limbOffset = random(-35, 35);
  antLen     = random(40, 75);
  antAngle   = random(360);
  tailLen    = random(50, 95);
  tailThick  = random(7, 18);
  tailAngle  = random(360);

  phaseCore   = random(628) * 0.01;
  phaseLimb   = random(628) * 0.01;
  phaseAnt    = random(628) * 0.01;
  phaseTail   = random(628) * 0.01;
  breathCore  = random(60, 150) * 0.01;
  breathLimb  = random(50, 130) * 0.01;
  breathAnt   = random(90, 200) * 0.01;
  breathTail  = random(60, 140) * 0.01;
  sniffOffset = random(200);

  blinkTimer    = frameCount;
  blinkInterval = int(random(48, 240));
  blinkOn       = false;
  blinkDur      = 0;

  bodyAngVel=0; bodyAng=0;
  limbAngVel=0; limbAng=0;
  tailAngVel=0; tailAng=0;
  antAngVel=0;  antAng=0;
  jitterAmt=0;
  headX=0; headY=0; headVX=0; headVY=0;

  impBodyNext = frameCount + int(random(6, 30));
  impLimbNext = frameCount + int(random(3, 20));
  impTailNext = frameCount + int(random(4, 17));
  impAntNext  = frameCount + int(random(2, 12));

  crState      = 0;
  crStateTimer = frameCount + int(random(30, 120));

  // anchor base positions (resting)
  a0bx=-0.45*width+width/2;  a0by=-0.42*height+height/2;
  a1bx= 0.45*width+width/2;  a1by=-0.42*height+height/2;
  a2bx=-0.48*width+width/2;  a2by= 0.00*height+height/2;
  a3bx= 0.48*width+width/2;  a3by= 0.00*height+height/2;
  a4bx=-0.45*width+width/2;  a4by= 0.42*height+height/2;
  a5bx= 0.45*width+width/2;  a5by= 0.42*height+height/2;

  n0x=random(100); n0y=random(100);
  n1x=random(100); n1y=random(100);
  n2x=random(100); n2y=random(100);
  n3x=random(100); n3y=random(100);
  n4x=random(100); n4y=random(100);
  n5x=random(100); n5y=random(100);
}

// ── DRAW ───────────────────────────────────────
function draw() {
  background(14);

  // manual distance to elastic point (no sqrt)
  let ddx = ex - mouseX;
  let ddy = ey - mouseY;
  md = ddx*ddx + ddy*ddy; // squared distance, no sqrt needed

  if (mouseIsPressed && !disintegrated && md < 3600) { // 60^2
    ex  = mouseX; ey = mouseY;
    let dx = ex-ecx, dy = ey-ecy;
    // approximate distance without sqrt, clamped to avoid overflow
    Dmp = constrain(dx*dx + dy*dy, 0, 40000) * 0.005;
    edx = dx; edy = dy;
  } else {
    if (Dmp > 0.01) {
      Dmp = lerp(Dmp, 0, bt);
      ex  = constrain(ecx + sft * edx * Dmp * sin(frameCount * elast), 0, width);
      ey  = constrain(ecy + sft * edy * Dmp * sin(frameCount * elast), 0, height);
    } else {
      let tx = map(noise(frameCount*0.018),      0,1,-230,230)
             + map(noise(frameCount*0.045+7),    0,1, -60, 60);
      let ty = map(noise(frameCount*0.018+99),   0,1,-180,180)
             + map(noise(frameCount*0.045+133),  0,1, -50, 50);
      ex = lerp(ex, ecx+tx, 0.06);
      ey = lerp(ey, ecy+ty, 0.06);
    }
  }

  let speedX = ex - ecx;
  let speedY = ey - ecy;
  let speed  = speedX*speedX + speedY*speedY; // quadrado

  drawSticks();
  drawCradle();

  // colored lines from elastic point to corners
  strokeWeight(1.2);
  drawColorLine(ex,ey, 0,0,         0);
  drawColorLine(ex,ey, width,0,     1);
  drawColorLine(ex,ey, 0,height,    2);
  drawColorLine(ex,ey, width,height,3);
  drawColorLine(ex,ey, width/2,0,   4);
  drawColorLine(ex,ey, width/2,height,5);
  drawColorLine(ex,ey, 0,height/2,  6);
  drawColorLine(ex,ey, width,height/2,7);

  fill(240); noStroke();
  circle(ex, ey, 10);

  push();
  translate(ex, ey);

  let tilt = map(speedX, -200, 200, -18, 18);
  rotate(tilt);

  crScale = lerp(crScale, map(speed, 0, 40000, 1.0, 1.15), 0.08);
  scale(crScale);

  let floatX = map(noise(frameCount*0.009+7),  0,1,-8, 8)
             + map(noise(frameCount*0.003+33),  0,1,-4, 4);
  let floatY = map(noise(frameCount*0.011+17), 0,1,-10,10)
             + map(noise(frameCount*0.004+55),  0,1,-5, 5);
  translate(floatX, floatY);

  // disintegration trigger by held frames
  if (isHolding && !disintegrated) {
    if (frameCount - holdStart >= HOLD_FRAMES) triggerDisintegration();
  }

  if (disintegrated) {
    drawCreatureOnlyCore();
    drawEye();
    updateAndDrawParticle();
  } else {
    drawCreature();
  }
  pop();

  // morph creature every MORPH_FRAMES
  if (!disintegrated && frameCount - morphTimer > MORPH_FRAMES) {
    morphTimer = frameCount;
    initCreature();
  }

  t += 0.04;
}

function drawColorLine(x1,y1,x2,y2, idx) {
  colorMode(HSB, 360, 100, 100, 100);
  stroke((frameCount*0.6 + idx*45) % 360, 70, 90, 75);
  colorMode(RGB, 255, 255, 255, 255);
  line(x1,y1,x2,y2);
}

// ── INVOLUNTARY MOTION ────────────────────────
function updateCreatureMotion() {
  if (frameCount > crStateTimer) {
    let r = random(10);
    crState      = r < 5 ? 0 : r < 8 ? 1 : 2;
    crStateTimer = frameCount + int(random(30, 180));
  }

  let s = crState==2 ? 3.8 : crState==1 ? 2.0 : 1.0;

  if (frameCount > impBodyNext) {
    bodyAngVel += random(-5,5)*s;
    jitterAmt   = random(1.5,5)*s;
    impBodyNext = frameCount + int(random(11,54));
  }
  bodyAngVel += map(noise(t*0.7+phaseCore), 0,1,-0.7,0.7)*s;
  bodyAngVel *= 0.89;
  bodyAng    += bodyAngVel;

  if (frameCount > impLimbNext) {
    limbAngVel += random(-12,12)*s;
    impLimbNext = frameCount + int(random(6,36));
  }
  limbAngVel += map(noise(t*1.4+phaseLimb+20), 0,1,-1.5,1.5)*s;
  limbAngVel *= 0.80;
  limbAng    += limbAngVel;

  if (frameCount > impTailNext) {
    tailAngVel += random(-14,14)*s;
    impTailNext = frameCount + int(random(5,27));
  }
  tailAngVel += map(noise(t*1.9+phaseTail+40), 0,1,-2.0,2.0)*s;
  tailAngVel *= 0.77;
  tailAng    += tailAngVel;

  if (frameCount > impAntNext) {
    antAngVel += random(-18,18)*s;
    impAntNext = frameCount + int(random(4,21));
  }
  antAngVel += map(noise(t*2.5+phaseAnt+60), 0,1,-2.5,2.5)*s;
  antAngVel *= 0.73;
  antAng    += antAngVel;

  jitterAmt *= 0.84;

  let hTx = map(noise(t*0.55+77), 0,1,-10,10);
  let hTy = map(noise(t*0.45+33), 0,1,-7,7);
  headVX += (hTx-headX)*0.08;
  headVY += (hTy-headY)*0.08;
  headVX *= 0.70; headVY *= 0.70;
  headX  += headVX; headY  += headVY;
}

// ── CREATURE DRAWING ──────────────────────────
function drawCreature() {
  updateCreatureMotion();

  // blink com frameCount
  if (frameCount - blinkTimer > blinkInterval) {
    blinkOn       = true;
    blinkTimer    = frameCount;
    blinkInterval = int(random(48, 270));
    blinkDur      = 6; // frames piscando
  }
  if (blinkOn) {
    blinkDur--;
    if (blinkDur <= 0) blinkOn = false;
  }

  let jx = random(-jitterAmt, jitterAmt);
  let jy = random(-jitterAmt, jitterAmt);
  let sqX = 1 + sin(t*breathCore*1.8+phaseCore)*0.14;
  let sqY = 1 - sin(t*breathCore*1.8+phaseCore)*0.11;

  push();
  translate(headX+jx, headY+jy);
  rotate(bodyAng);
  scale(sqX, sqY);

  drawTail();
  drawLimb();
  drawCore();
  drawAntenna();
  drawEye();
  pop();
}

function drawCreatureOnlyCore() {
  fill(200); stroke(200); strokeWeight(3);
  beginShape();
  for (let i=0; i<6; i++) {
    let a = (360/6)*i;
    let r = coreSize + sin(t*6+i*60)*10;
    vertex(cos(a)*r, sin(a)*r);
  }
  endShape(CLOSE);
}

function drawCore() {
  fill(200); stroke(200); strokeWeight(3);
  beginShape();
  for (let i=0; i<6; i++) {
    let a = (360/6)*i;
    let n = map(noise(t*breathCore*0.6+i*1.3+sniffOffset*0.05), 0,1,-13,15);
    let b = sin(t*breathCore*2.2+phaseCore+i*1.05)*6;
    vertex(cos(a)*(coreSize+n+b), sin(a)*(coreSize+n+b));
  }
  endShape(CLOSE);
}

function drawEye() {
  let eyeR  = coreSize * 0.25;
  let gazeX = map(ex-ecx, -250,250, -eyeR*0.6, eyeR*0.6)
            + map(noise(t*5.1+7),  0,1,-2,2);
  let gazeY = map(ey-ecy, -250,250, -eyeR*0.6, eyeR*0.6)
            + map(noise(t*4.7+17), 0,1,-2,2);
  let eyeH  = blinkOn ? eyeR*0.05 : eyeR*1.7;
  fill(230); noStroke();
  ellipse(0, -coreSize*0.28, eyeR*2.2, eyeH);
  if (!blinkOn) {
    fill(15);  ellipse(gazeX, -coreSize*0.28+gazeY, eyeR, eyeR);
    fill(255); ellipse(gazeX+eyeR*0.22, -coreSize*0.28+gazeY-eyeR*0.22, eyeR*0.3, eyeR*0.3);
  }
}

function drawLimb() {
  noFill(); stroke(200);
  push();
  let swing = limbAng + map(noise(t*breathLimb*0.8+sniffOffset+10), 0,1,-15,15);
  rotate(limbAngle+swing);
  translate(limbOffset, 0);

  let stretch = limbLen*(1+sin(t*breathLimb*3.0+phaseLimb)*0.22);
  let half    = stretch*0.5;
  let bendAng = sin(t*breathLimb*2.5+phaseLimb)*35
              + map(noise(t*breathLimb*1.2+sniffOffset+5), 0,1,-20,20);

  strokeWeight(limbThick*0.75);
  let mx = cos(radians(bendAng))*half;
  let my = sin(radians(bendAng))*half*0.45;
  line(0,0, mx,my);

  strokeWeight(limbThick*0.45);
  let endAng = bendAng*1.35+sin(t*breathLimb*1.8)*20;
  let ex2 = mx+cos(radians(endAng+25))*half*0.9;
  let ey2 = my+sin(radians(endAng+25))*half*0.6;
  line(mx,my, ex2,ey2);

  strokeWeight(1.5);
  let grr = random(-1,1);
  line(ex2,ey2, ex2+cos(radians(endAng+55+grr))*13, ey2+sin(radians(endAng+55+grr))*13);
  line(ex2,ey2, ex2+cos(radians(endAng-15+grr))*11, ey2+sin(radians(endAng-15+grr))*11);
  pop();
}

function drawAntenna() {
  noFill(); stroke(200);
  push();
  let baseRot = antAng
              + map(noise(t*breathAnt*0.4+sniffOffset),      0,1,-30,30)
              + map(noise(t*breathAnt*0.15+sniffOffset+50),  0,1,-15,15);
  rotate(antAngle+baseRot);

  let segs   = 6;
  let segLen = antLen/segs;
  let ax=0, ay=0, cumAng=0;
  for (let i=0; i<segs; i++) {
    let frac = i/segs;
    cumAng += sin(t*breathAnt*3.8+phaseAnt+frac*6.5)*18
            + map(noise(t*1.8+i*1.5+sniffOffset), 0,1,-10,10);
    let nx = ax+cos(radians(cumAng-90))*segLen;
    let ny = ay+sin(radians(cumAng-90))*segLen;
    strokeWeight(map(i, 0,segs, 3.5,0.8));
    line(ax,ay, nx,ny);
    ax=nx; ay=ny;
  }
  let tip = 1+sin(t*breathAnt*5+phaseAnt)*0.45;
  fill(200); strokeWeight(1);
  ellipse(ax,ay, 17*tip, 10*tip);
  pop();
}

function drawTail() {
  noFill(); stroke(200);
  push();
  let baseAng = tailAng*0.55
              + map(noise(t*breathTail*0.5+phaseTail), 0,1,-18,18);
  rotate(tailAngle+baseAng);

  let segs=10, cx0=0, cy0=0;
  for (let i=1; i<=segs; i++) {
    let frac = i/segs;
    let wave = sin(t*breathTail*6.5+phaseTail+frac*7.5)*tailThick*frac*1.9
             + map(noise(t*0.9+frac*2.2+phaseTail), 0,1,-3,3)*frac*2;
    let nx = frac*tailLen;
    let ny = wave;
    strokeWeight(map(frac, 0,1, tailThick*0.9, 0.7));
    line(cx0,cy0, nx,ny);
    cx0=nx; cy0=ny;
  }
  pop();
}

// ── DISINTEGRATION ────────────────────────────
function triggerDisintegration() {
  disintegrated=true; returning=false;
  disintAt=frameCount;
  looseX=random(-50,50); looseY=random(-50,50);
  looseVX=random(-3.5,3.5); looseVY=random(-5,-1);
  looseRot=random(360); looseRotSpd=random(-5,5);
  looseGrav=random(6,14)*0.01;
  looseBounces=0; looseSettled=false;
}

function updateAndDrawParticle() {
  let halfW=width/2-40, halfH=height/2-40;
  let RETURN_FRAMES=150;

  if (!returning && frameCount-disintAt > RETURN_FRAMES) returning=true;

  if (returning) {
    let dx=-looseX, dy=-looseY;
    let dSq=dx*dx+dy*dy;
    if (dSq > 25) {
      // attract back to center using lerp
      
      looseVX = lerp(looseVX, dx*0.04, 0.15);
      looseVY = lerp(looseVY, dy*0.04, 0.15);
      looseVX *= 0.87; looseVY *= 0.87;
      looseRotSpd *= 0.91;
      looseX += looseVX; looseY += looseVY; looseRot += looseRotSpd;
    } else {
      looseX=0; looseY=0; looseVX=0; looseVY=0; looseRotSpd=0;
      disintegrated=false; returning=false;
    }
  } else if (!looseSettled) {
    looseVY += looseGrav;
    looseX  += looseVX; looseY += looseVY; looseRot += looseRotSpd;
    if (looseX >  halfW) { looseX= halfW; looseVX*=-0.6; looseRotSpd*=-0.8; }
    if (looseX < -halfW) { looseX=-halfW; looseVX*=-0.6; looseRotSpd*=-0.8; }
    if (looseY >  halfH) { looseY=halfH;  looseVY*=-0.5; looseVX*=0.85; looseRotSpd*=0.7; looseBounces++; }
    if (looseY < -halfH) { looseY=-halfH; looseVY*=-0.5; }
    // check if particle nearly stopped (squared values)
    if (looseBounces>=2 && looseVY*looseVY<0.16 && looseVX*looseVX<0.09) looseSettled=true;
  }
  push();
  translate(looseX,looseY); rotate(looseRot);
  noFill(); stroke(200); strokeWeight(2.5);
  rect(0, -limbThick/2, limbLen, limbThick);
  line(0,0, 0,-antLen); ellipse(0,-antLen-10, 20,12);
  triangle(0,0, tailLen,-tailThick, tailLen,tailThick);
  pop();
}

// ── CAT'S CRADLE ──────────────────────────────
// ── BACKGROUND STICKS ─────────────────────────
let stickCount = 220;
// arrays of primitive numbers (not p5 vectors)
let stickX = [], stickY = [], stickA = [], stickL = [], stickSpd = [], stickAlpha = [];

function initSticks() {
  for (let i = 0; i < stickCount; i++) {
    stickX[i]     = random(width);
    stickY[i]     = random(height);
    stickA[i]     = random(360);
    stickL[i]     = random(4, 28);
    stickSpd[i]   = random(0.002, 0.012);
    stickAlpha[i] = random(18, 80);
  }
}

function drawSticks() {
  noFill();
  for (let i = 0; i < stickCount; i++) {
    let ang = stickA[i] + map(noise(i*0.37 + frameCount*stickSpd[i]), 0, 1, -22, 22);
    let len = stickL[i] * (1 + sin(frameCount*stickSpd[i]*3 + i)*0.22);
    let x1 = stickX[i] + cos(ang) * len * 0.5;
    let y1 = stickY[i] + sin(ang) * len * 0.5;
    let x2 = stickX[i] - cos(ang) * len * 0.5;
    let y2 = stickY[i] - sin(ang) * len * 0.5;
    // pulse alpha with noise for subtle shimmer
    let a = stickAlpha[i] * map(noise(i*0.9 + frameCount*0.003), 0, 1, 0.5, 1.3);
    stroke(255, 255, 255, a);
    strokeWeight(map(stickL[i], 4, 28, 0.4, 1.1));
    line(x1, y1, x2, y2);
  }
}

function drawCradle() {
  // update anchor positions with noise
  let r0=55, r1=69, r2=83, r3=97, r4=111, r5=125;
  let s0=0.008, s1=0.011, s2=0.014, s3=0.017, s4=0.020, s5=0.023;
  a0x=a0bx+map(noise(n0x+frameCount*s0),      0,1,-r0,r0);
  a0y=a0by+map(noise(n0y+frameCount*s0*0.71), 0,1,-r0*0.65,r0*0.65);
  a1x=a1bx+map(noise(n1x+frameCount*s1),      0,1,-r1,r1);
  a1y=a1by+map(noise(n1y+frameCount*s1*0.71), 0,1,-r1*0.65,r1*0.65);
  a2x=a2bx+map(noise(n2x+frameCount*s2),      0,1,-r2,r2);
  a2y=a2by+map(noise(n2y+frameCount*s2*0.71), 0,1,-r2*0.65,r2*0.65);
  a3x=a3bx+map(noise(n3x+frameCount*s3),      0,1,-r3,r3);
  a3y=a3by+map(noise(n3y+frameCount*s3*0.71), 0,1,-r3*0.65,r3*0.65);
  a4x=a4bx+map(noise(n4x+frameCount*s4),      0,1,-r4,r4);
  a4y=a4by+map(noise(n4y+frameCount*s4*0.71), 0,1,-r4*0.65,r4*0.65);
  a5x=a5bx+map(noise(n5x+frameCount*s5),      0,1,-r5,r5);
  a5y=a5by+map(noise(n5y+frameCount*s5*0.71), 0,1,-r5*0.65,r5*0.65);

  noFill();

  // main thread through all anchor points
  stroke(140,15,15,180); strokeWeight(1.8);
  beginShape();
  curveVertex(a0x,a0y); curveVertex(a0x,a0y);
  curveVertex(a1x,a1y); curveVertex(a2x,a2y);
  curveVertex(a3x,a3y); curveVertex(a4x,a4y);
  curveVertex(a5x,a5y); curveVertex(a5x,a5y);
  endShape();

  // crossed threads with animated color
  drawWire(a0x,a0y,a5x,a5y,0);
  drawWire(a1x,a1y,a4x,a4y,1);
  drawWire(a0x,a0y,a3x,a3y,2);
  drawWire(a1x,a1y,a2x,a2y,3);
  drawWire(a2x,a2y,a5x,a5y,4);
  drawWire(a3x,a3y,a4x,a4y,5);
  drawWire(a0x,a0y,a4x,a4y,6);
  drawWire(a1x,a1y,a5x,a5y,7);
  drawWire(a2x,a2y,a3x,a3y,8);

  // secondary thin threads
  drawSecondary(a0x,a0y,a2x,a2y,0);
  drawSecondary(a1x,a1y,a3x,a3y,1);
  drawSecondary(a2x,a2y,a4x,a4y,2);
  drawSecondary(a3x,a3y,a5x,a5y,3);
  drawSecondary(a4x,a4y,a0x,a0y,4);
  drawSecondary(a5x,a5y,a1x,a1y,5);

  // anchor dots
  fill(160,25,25,120); noStroke();
  circle(a0x,a0y,5); circle(a1x,a1y,5); circle(a2x,a2y,5);
  circle(a3x,a3y,5); circle(a4x,a4y,5); circle(a5x,a5y,5);
  noFill();
}

function drawWire(ax,ay,bx,by,idx) {
  let hShift = (idx*22 + frameCount*0.3) % 60;
  colorMode(HSB, 360, 100, 100, 100);
  let h = 350 + hShift;
  if (h > 360) h = h - 360;
  stroke(h, 80, 75, 70);
  colorMode(RGB, 255, 255, 255, 255);
  strokeWeight(map(idx, 0,9, 1.5,0.6));
  let mx=(ax+bx)/2+(ex-width/2)*0.08;
  let my=(ay+by)/2+(ey-height/2)*0.08;
  beginShape();
  curveVertex(ax,ay); curveVertex(ax,ay);
  curveVertex(mx,my);
  curveVertex(bx,by); curveVertex(bx,by);
  endShape();
}

function drawSecondary(ax,ay,bx,by,idx) {
  stroke(180,30,30,60); strokeWeight(0.5);
  let cx=(ax+bx)/2+sin(frameCount*0.02+idx)*30;
  let cy=(ay+by)/2+cos(frameCount*0.015+idx)*20;
  beginShape();
  curveVertex(ax,ay); curveVertex(ax,ay);
  curveVertex(cx,cy);
  curveVertex(bx,by); curveVertex(bx,by);
  endShape();
}

// ── MOUSE ─────────────────────────────────────
function mousePressed() {
  isHolding=true; holdStart=frameCount;
  if (disintegrated) { disintegrated=false; initCreature(); }
}
function mouseReleased() { isHolding=false; }
