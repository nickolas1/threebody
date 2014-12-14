/*jshint quotmark: double, unused: false  */
"use strict";
/*global Body*/

/**
* Creates an instance of System. 
* The System holds a collection of {@link Body}s.
*
* @constructor
* @param {Number} N The number of bodies in the N-body system
*/

function System(N) {
  /** @member {Number} N The number of bodies in the N-body system */
  this.N = N;

  /** @member {Body[]} bodies Array of Body objects at the current timestep */
  this.bodies = Array.apply(null, new Array(N)).map(Number.prototype.valueOf,0);
  /** @member {Body[]} bodiesLast Array of Body objects at the previous timestep */
  this.bodiesLast = Array.apply(null, new Array(N)).map(Number.prototype.valueOf,0);
  /** @member {Body[]} bodiesPlot Array of Body objects at the interpolated plotting time */
  this.bodiesPlot = Array.apply(null, new Array(N)).map(Number.prototype.valueOf,0);
  
  /** @member {Number} timescale The natural timescale of the system */
  this.timescale = 6.25;
  
  /*this.bodies.forEach(function (v, i, a) {
    a[i] = new Body(i, masses[i], pos[i], vel[i], [0, 0, 0]);
  });*/
  
  this.bodies.forEach(function (v, i, a) {
    a[i] = new Body(i, i, [i, i, i], [i, i, i], [0, 0, 0]);
  });
  
  this.bodiesLast.forEach(function (v, i, a) {
    a[i] = new Body(i, 0, [0, 0, 0], [0, 0, 0], [0, 0, 0]);
  });  
  
  this.bodiesPlot.forEach(function (v, i, a) {
    a[i] = new Body(i, 0, [0, 0, 0], [0, 0, 0], [0, 0, 0]);
  }); 
  
  /** @member {Number[]} shape Array containing the shape parameters r, x, y */
  this.shape = {"r": 0, "x": 0, "y": 0};
 // this.calcTriangleSizeAndShape();
  
  /** @member {Number} initialEnergy The system's total energy at time 0 */
  this.initialEnergy = null;
  /** @member {Number[]} initialEnergy The system's total energy at time 0 */
  this.angularMomentum = [null, null, null];
}

/**
* Method to calculate the system's natural timescale, taken to be an estimate of the
* free-fall timescale
*/
System.prototype.calcTimescale = function() {
  var rMean,
    density,
    totalMass,
    r2,
    i,
    k;
    
  rMean = 0;
  totalMass = 0;
  for (i = 0; i < this.N; i += 1) {
    r2 = 0;
    for (k = 0; k < 3; k += 1) {
      r2 += this.bodies[i].pos[k] * this.bodies[i].pos[k];
    }

   // rMean += Math.sqrt(r2);
    rMean = Math.max(rMean, Math.sqrt(r2));
    totalMass += this.bodies[i].mass;
  }
  
 // rMean /= this.N;
  density = totalMass / Math.pow(rMean, 3);

  this.timescale = 5/Math.sqrt(density);
};

/**
* Method to interpolate the positions of {@link System.bodiesLast} to the desired drawing
* time. This is done by simply linearly interpolating from whichever of the two avaiable
* times is closest to the target time.
*
* @param {Number} timeNew The time that {@link System.bodies} inhabits
* @param {Number} timeOld The time that {@link System.bodiesLast} inhabits
* @param {Number} timeTarget The desired drawing time
*/
System.prototype.estimateDrawingTime = function(timeNew, timeOld, timeTarget) {
  var dt,
    halfdt2,
    bodies,
    i, k;
    
  // figure out which of our two available times is closer to the target time
  if (timeNew - timeTarget <= timeTarget - timeOld) {
    dt = timeTarget - timeNew;
    bodies = this.bodies;
  }
  else {
    dt = timeTarget - timeOld;
    bodies = this.bodiesLast;
  }
  halfdt2 = 0.5 *  dt * dt;
  
  for (i = 0; i < this.N; i += 1) {
    for (k = 0; k < 3; k += 1) {
      this.bodiesPlot[i].pos[k] = 
        bodies[i].pos[k] + 
        bodies[i].vel[k] * dt + 
        bodies[i].acc[k] * halfdt2;
    }
  }
};

/**
* Method to calculate the {@link System.shape} parameters r, x, y
*/
System.prototype.calcTriangleSizeAndShape = function() {
  var r210 = 0,
    r220 = 0,
    r221 = 0,
    dr,
    m0 = this.bodies[0].mass,
    m1 = this.bodies[1].mass,
    m2 = this.bodies[2].mass,
    k;
  
  // since this is just used for plotting, use bodiesPlot  
  for (k = 0; k < 3; k += 1) {
    dr = this.bodiesPlot[1].pos[k] - this.bodiesPlot[0].pos[k];
    r210 += dr * dr;
    
    dr = this.bodiesPlot[2].pos[k] - this.bodiesPlot[0].pos[k];
    r220 += dr * dr;
  
    dr = this.bodiesPlot[2].pos[k] - this.bodiesPlot[1].pos[k];
    r221 += dr * dr;
   
  }
  
  this.shape.r = Math.sqrt((m1*m0*r210 + m2*m0*r220 + m2*m1*r221) / (m0+m1+m2));
  this.shape.x = (r220 + r221 - 2*r210) / (r210 + r220 + r221);
  this.shape.y = 1.73205081 * (r221 - r220) / (r210 + r220 + r221);
  // 1.73205081 approx sqrt(3)
};


/**
* Method to move the {@link System.bodies} to the center of momentum frame
*/
System.prototype.moveToCenterOfMomentum = function() {
  var k,
    cm;
  
  var calcCenterOfMomentum = function(bodies) {
    var cmPos = [0, 0, 0],
      cmVel = [0, 0, 0],
      totalMass = 0,
      k;
  
    bodies.forEach(function (v) {
      totalMass += v.mass;
    });
  
    bodies.forEach(function (v) {
      for(k = 0; k < 3; k += 1){
        cmPos[k] += v.mass * v.pos[k] / totalMass;
        cmVel[k] += v.mass * v.vel[k] / totalMass;
      }
    });
  
    return {
      pos: cmPos,
      vel: cmVel
    };
  };

  cm = calcCenterOfMomentum(this.bodies);

  // move to the center of mass
  this.bodies.forEach(function (v, i, a) {
    for (k = 0; k < 3; k += 1) {
      a[i].pos[k] -= cm.pos[k];
      a[i].vel[k] -= cm.vel[k];
    }
  }, this);  
};

/**
* Calculate the total energy of the {@link System.bodies}
*/
System.prototype.calcTotalEnergy = function() {
  var calcKineticEnergy = function(bodies) {
    var ke = 0,
      v2,
      k;
  
    bodies.forEach(function (v) {    
      v2 = 0;
      for(k = 0; k < 3; k += 1){
        v2 = v2 + v.vel[k] * v.vel[k];
      }
      ke += 0.5 * v.mass * v2;
    });
  
    /** @member {Number[]} kineticEnergy The kinetic energy */
    return ke;
  }; 
  
  var calcPotentialEnergy = function(bodies) {
    var dr = [0, 0, 0],
      r2,
      pot = 0,
      posi,
      mi,
      posj,
      mj,
      N = bodies.length,
      i, j, k;
  
    for (i = 0; i < N - 1; i += 1) {
      for (j = i + 1; j < N; j += 1) {
        //get the potential contribution from each pair
        r2 = 0;
        for(k = 0; k < 3; k += 1){
          dr[k] = bodies[j].pos[k] - bodies[i].pos[k];
          r2 += dr[k] * dr[k];
        }
        pot -= bodies[i].mass * bodies[j].mass / Math.sqrt(r2);  
      }
    }
    return pot;
  };
  
  var kin = calcKineticEnergy(this.bodies),
    pot = calcPotentialEnergy(this.bodies);
  
  /** @member {Number[]} totalEnergy The kinetic plus potential energy */
  this.totalEnergy = kin + pot;
};


/**
* Method to calculate the angular momentum of the {@link System.bodies}
*/
System.prototype.calcAngularMomentum = function() {
  var i,
    b = this.bodies;
  
  this.angularMomentum = [0, 0, 0];
  for (i = 0; i < this.N; i += 1) {
    this.angularMomentum[0] += b[i].mass * (b[i].pos[1] * b[i].vel[2] - b[i].pos[2] * b[i].vel[1]);
    this.angularMomentum[1] += b[i].mass * (b[i].pos[2] * b[i].vel[0] - b[i].pos[0] * b[i].vel[2]);
    this.angularMomentum[2] += b[i].mass * (b[i].pos[0] * b[i].vel[1] - b[i].pos[1] * b[i].vel[0]);
  }
};

/**
* Copy bodies to bodiesLast before taking an 
* integration step
*/
System.prototype.copyBodiesToBodiesLast = function() {
  var i;
  for (i = 0; i < this.N; i += 1) {
    this.bodiesLast[i].pos = this.bodies[i].pos.slice(0);
    this.bodiesLast[i].vel = this.bodies[i].vel.slice(0);
    this.bodiesLast[i].acc = this.bodies[i].acc.slice(0);
  }
};


/**
* Method to calculate and set the gravitational accelerations of {@link System.bodies}
*/
System.prototype.calcAccels = function() {
  var i, j, k,
      r2,
      r3,
      a,
      dr = [0, 0, 0],
      mfaci,
      mfacj,
      bodiesi,
      bodiesj;
  
  // reset accels to 0
  for (i = 0; i < this.N; i += 1) {
    this.bodies[i].acc = [0, 0, 0];
  }   
  
  // add pairwise force to each body
  for (i = 0; i < this.N - 1; i += 1) {
    bodiesi = this.bodies[i];
    for (j = i + 1; j < this.N; j += 1) {    
    bodiesj = this.bodies[j];
      dr = [
          bodiesj.pos[0] - bodiesi.pos[0],
          bodiesj.pos[1] - bodiesi.pos[1],
          bodiesj.pos[2] - bodiesi.pos[2]
        ];
      r2 = dr[0]*dr[0] + dr[1]*dr[1] + dr[2]*dr[2];
      r3 = r2 * Math.sqrt(r2);

      mfaci = bodiesi.mass / r3;
      mfacj = bodiesj.mass / r3;
      bodiesi.acc[0] += dr[0] * mfacj;
      bodiesi.acc[1] += dr[1] * mfacj;
      bodiesi.acc[2] += dr[2] * mfacj;
      bodiesj.acc[0] -= dr[0] * mfaci;
      bodiesj.acc[1] -= dr[1] * mfaci;
      bodiesj.acc[2] -= dr[2] * mfaci;      
    }
  }
};

