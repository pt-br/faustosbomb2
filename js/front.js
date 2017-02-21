function min(a, b) { return a > b ? b : a; }
function max(a, b) { return a < b ? b : a; }

var socket = io.connect(location.hostname+':8080');



document.addEventListener('DOMContentLoaded', function() {
    var ww = 480, wh = 480, ts = 24;
    var kpa, kp, kclr, wait=0;
    var cv, cvs, dt, ltm, mdata = [];
    var cv, getDt, clr, rec, txt, reset, update, draw, map, dropBomb, pass, explode;
    cv = function(w, h) {
      if (!cvs) {
        ww = w || ww;
        wh = h || wh;
        var nc = document.createElement('canvas');
        nc.setAttribute("id", "gamecanvas");
        nc.setAttribute("width", ww);
        nc.setAttribute("height", wh);
        document.body.appendChild(nc);
        cvs = document.getElementById("gamecanvas").getContext("2d");
        window.addEventListener('keydown', function(e) { console.log(e.code); kpa[e.code] = 1; });
        window.addEventListener('keyup', function(e) { kpa[e.code] = 3; });
      }
      return cvs;
    };

    kp    = function(k) { return kpa[k] || 4; };
    kclr  = function() { for (i in kpa) { kpa[i] += (kpa[i] % 2 == 1 ? 1 : 0); } };
    clr   = function(c) { cv().fillStyle = c; };
    rec   = function(x, y, w, h, c) { if (c) clr(c); cv().fillRect(Math.floor(x), Math.floor(y), w, h); };
    txt   = function(str, x, y, c) { if (c) clr(c); cv().fillText(str, Math.floor(x), Math.floor(y)); };
    getDt = function() { var now = (new Date).getTime(), dt = now - ltm; ltm = now; return .001*dt; };
    map   = function(x, y) { return mdata[x+20*y] || ((x == 0 || y == 0 || x == 19 || y == 19 || (x%4==0 && y%4==0)) ? [1,0] : [0,0]); };
    pass  = function(nx,ny) {var v = map(Math.floor(nx+.5),Math.floor(ny+.5)); return v[0]==0 || v[0]>1; };

    dropBomb = function (c) {
      var x=Math.floor(c.x+.5), y=Math.floor(c.y+.5);
      if (map(x,y)[0] == 0 || map(x,y)[1] > 2) { mdata[x+20*y] = [2,3]; }
    };
    explode = function (x,y) {
      var i;
      for (i=-2;i<3;i++) {
        if (map(x+i,y)[0]!=1) { mdata[(x+i)+20*y] = [3,2]; }
        if (map(x,y+i)[0]!=1) { mdata[x+20*(y+i)] = [3,2]; }
      }
    }

    update = function () {
      var dt = getDt();

      var nx=pc.x,ny=pc.y;
      if(kp("ArrowUp")<3){ny-=10*dt;}
      if(kp("ArrowDown")<3){ny+=10*dt;}
      if(kp("ArrowLeft")<3){nx-=10*dt;}
      if(kp("ArrowRight")<3){nx+=10*dt;}
      if(kp("Space")==1){ dropBomb(pc); }
      if (pass(nx,ny)){ pc.x=nx;pc.y=ny; }

      // wait+=(dt||0);
      // if (wait > .1) {
        // wait-=1;
        console.log('sending updatePlayer');
        socket.emit('updatePlayer', { me: pc });
      // }

      blist.forEach(function (b, i){ b.t-=dt; if (b.t<=0) explode(b); });
      var i, j, v;
      for (j = 0; j < 20; j++) {
        for (i = 0; i < 20; i++) {
          v = map(i, j);
          if (v[0]>0 && v[1]>0){
            v[1]-=dt;
            if (v[1]<=0){
              if (v[0] == 2) { explode(i,j); }
              if (v[0] == 3) { mdata[i+20*j] = [0,6]; }
            }
          }
        }
      }

      kclr();
      draw();
      requestAnimationFrame(update.bind(this));
    }


    draw = function() {
      rec(0,0,ww,wh,"#ccc");
      var i, j, v;
      for (j = 0; j < 20; j++) {
        for (i = 0; i < 20; i++) {
          v = map(i, j)[0];
          if (v > 0) {
            rec(ts*i, ts*j, ts, ts, (v==1?"#111":(v==2?"#999":"#d00")));
          }
        }
      }
      blist.forEach(function (b, i){
        var t = .1 * b.t;
        rec(ts*b.x+2, ts*b.y+2, ts-4, ts-4, "#666");
      });
      blist = blist.filter(function (b) { return b.t >= 0; });
      clist.forEach(function (c){ rec(ts*c.x, ts*c.y, ts, ts, c==pc? "#5a5" : "#55a"); });
    };


    // init
    var kpa={};
    var pc={x:2,y:2,bm:1,bu:0,id:""};
    var clist = [pc];
    var blist = [];
    socket.on('getPlayers', (data) => {
      console.log('[Socket.io - Client] Received players:', data);
      pc.id = data.me.id;
      pc.x = data.me.x;
      pc.y = data.me.y;
      data.allPlayers.forEach(function (c) {
        if (c.id != pc.id) {
          clist.push({x:c.x,y:c.y,bm:1,bu:0,id:c.id});
        }
      });
    });
    socket.on('updatePlayers', (data) => {
      console.log('[Socket.io - Client] Updated players:', data);
      if (data.disconnectPlayer != "") {
        (data.allPlayers || []).forEach(function (c) {
          clist = clist.filter(function (c) { return c.id != data.disconnectPlayer; });
        });
      }
      (data.allPlayers || []).forEach(function (dc) {
        var exists = clist.some(function (c) { return c.id == dc.id; });
        if (!exists && dc.id != pc.id) {
          clist.push({x:dc.x,y:dc.y,bm:1,bu:0,id:dc.id});
        }
        clist.forEach(function (c) {
          if(c.id == dc.id && dc.id != pc.id) {
            c.x = dc.x;
            c.y = dc.y;
          }
        });
      });
    });



    update();
});


// var start = function () {
//   this.cv = function (w, h) {
//     if (!this.cvs) {
//       this.ww = w || 320, this.wh = h || 240;
//       var nc = document.createElement('canvas');
//       nc.setAttribute("id", "gamecanvas");
//       nc.setAttribute("width", this.ww);
//       nc.setAttribute("height", this.wh);
//       document.body.appendChild(nc);
//       this.cvs = document.getElementById("gamecanvas").getContext("2d");
//       //key control
//       kpa = {} 
//       window.addEventListener('keydown', function (e) { console.log(e.code); kpa[e.code] = 1; });
//       window.addEventListener('keyup', function (e) { kpa[e.code] = 3; });
//       kp = function (k) { return kpa[k] || 4; }
//       kclr = function () { for (i in kpa){ kpa[i] += (kpa[i] % 2 == 1 ? 1 : 0); } }
//     }
//     return this.cvs;
//   };
//   this.getDt = function () {
//     var now = (new Date).getTime(), dt = now - this.ltm;
//     this.ltm = now;
//     return dt;
//   }
//   this.clr = function (c) { this.cv().fillStyle = c; }
//   this.rec = function (x,y,w,h,c) { if (c) this.clr(c); this.cv().fillRect(Math.floor(x),Math.floor(y),w,h); }
//   this.txt = function (str,x,y,c) { if (c) this.clr(c); this.cv().fillText(str,Math.floor(x),Math.floor(y)); }
//   this.img = function (i,x,y) { this.cv().drawImage(i,Math.floor(x),Math.floor(y));}
//   this.map = function (x,y) { return (this.mdata[x] && this.mdata[x][y]) || (y%15==1 ? 1 : 0); }
//   this.moveTo = function (c,nx,ny) {
//     var ts = this.ts;
//     if (this.map(Math.floor(nx/ts),Math.floor(ny/this.ts))>0 ||
//     this.map(Math.floor((nx+ts-1)/ts),Math.floor(ny/this.ts))>0 ||
//     this.map(Math.floor(nx/ts),Math.floor((ny+ts-1)/this.ts))>0 ||
//     this.map(Math.floor((nx+ts-1)/ts),Math.floor((ny+ts-1)/this.ts))>0
//     ) return false;
//     c.x=nx,c.y=ny; return true;
//   }
//   this.init();
// };
// start.prototype.reset = function () {
//   this.gtm = 0;
//   this.pc = {x:2*this.ts,y:3*this.ts,vy:0,gnd:false,sd:0};
//   this.mdata = [];
//   var i;
//   for (i=0;i<1000;i++) {
//     this.mdata.push(i%5==1?[1,1,1,0,0,1]:[1]);
//   }
//   this.offset = [0,0];
//   this.shots = [];
//   this.update();
// };
// start.prototype.update = function () {
//   if (kp("KeyR")<2) { kclr(); reset(); return; }
//   var dt = (.001*this.getDt()||0);
//   this.gtm += dt;
//   var ts = this.ts;
//   var st = 200*dt;
//   //player control
//   var pc = this.pc;
//   pc.vy = min(10*ts, pc.vy+700*dt);
//   var nx = pc.x+2*(kp("ArrowRight")<3?st:(kp("ArrowLeft")<3?-st:0))+st,
//     ny = pc.y+(kp("ArrowDown")<3?st:(kp("ArrowUp")<3?-st:0));
//   this.moveTo(pc,nx,ny)
//   this.offset = [
//     min(pc.x+3*ts, max(0,this.offset[0]+max(-st, min(st, (pc.x-3*ts-this.offset[0]))))),
//     max(0,this.offset[1]+max(-st, min(st, (pc.y-3*ts-this.offset[1]))))
//   ];
//   pc.sd -= dt;
//   if (pc.sd < 0) {
//     pc.sd += .6;
//     this.shots.push({x:pc.x+ts,y:pc.y+.5*ts,d:30});
//   }
//   this.shots.forEach(function (s, i) {
//     s.x += s.d*dt*ts;
//     if (Math.abs(s.x-pc.x)>this.ww) {
//       this.shots.splice(i, 1);
//     }
//   });
//   //draw background
//   this.rec(0,0,this.ww,this.wh,"#430");
//   for (j=0; j<20; j++){
//     for (i=0; i<20; i++){
//       this.rec(ts*i,ts*j,ts,ts,"#9a0");
//     }
//   }
//   kclr();
//   requestAnimationFrame(this.update.bind(this));
// };
// start.prototype.init = function () {
//   this.cv(480, 480);
//   this.ts = 24;
//   this.reset();
// };
//game = new start();