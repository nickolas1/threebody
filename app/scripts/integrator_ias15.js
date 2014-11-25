/*jshint quotmark: double, unused: false*/
"use strict";


/**
takes as input a system object
*/

function IntegratorIAS15(system) {

  this.sps = 60; /* steps per second */
  this.redraw = 2;
  this.transitionTime = 250;
  
  this.system = system;
  
  // integrator control parameters
  this.epsilon = 1e-9;
  //this.epsilon = 0;
  this.safetyFactor = 0.25;
  
  this.maxDt = 1e300;
  
  this.N = this.system.N;
  this.N3 = 3 * this.N;
  
  this.minDt = 1e-12;
  
  var maxDt;
  Object.defineProperty(this, "maxDt", {
    get: function() {
      return maxDt;
    },
    set: function(maxDtNew) {
      maxDt = maxDtNew;
      if (this.dt > maxDtNew) {
        this.dt = maxDtNew;
      }
    },
    enumerable: true,
    configurable: true
  });
  
  this.clearIntegrator();
  
  this.setConstants();
}

IntegratorIAS15.prototype.clearIntegrator = function() {
  this.time = 0;
  this.lastSuccessfulDt = 0;
  this.dt = 0.01;
  
  console.log("clearing integrator",this.time,this.lastSuccessfulDt);
  
  this.pos0 = Array.apply(null, new Array(this.N3)).map(Number.prototype.valueOf,0);
  this.vel0 = Array.apply(null, new Array(this.N3)).map(Number.prototype.valueOf,0);
  this.acc0 = Array.apply(null, new Array(this.N3)).map(Number.prototype.valueOf,0);
  this.acc1 = Array.apply(null, new Array(this.N3)).map(Number.prototype.valueOf,0);
  this.cspos = Array.apply(null, new Array(this.N3)).map(Number.prototype.valueOf,0);
  this.csvel = Array.apply(null, new Array(this.N3)).map(Number.prototype.valueOf,0);
  
  this.g = [[], [], [], [], [], [], []];
  this.b = [[], [], [], [], [], [], []];
  this.e = [[], [], [], [], [], [], []];
  this.updateResetArrays();
  
  this.initializeZeroArrays();
};


/* actual integration step. returns 1 if successful, 0 if unsuccessful
*/
IntegratorIAS15.prototype.integrationStep = function() {
  var stepTimeStart = this.time,
    stepTime,
    predictorCorrectorError = 1e300,
    predictorCorrectorErrorPrevious = 2,
    iterations = 0,
    stepDone,
    dtLast,
    dtNew,
    ratio,
    integratorError,
    i, k, n;
    
  //console.log("time: ",this.time, this.dt);
  
  this.system.calcAccels();
  
  this.copyBodiesToBodiesLast();
  
  this.copyBodiesToPosVelAcc(); 
  
  this.setGArray();
  
  // predictor corrector loop starts here
  // halt criteria: error better than 1e-16, error oscillates, 12 iterations
  stepDone = this.checkPredCorrBreaks(iterations, predictorCorrectorError, 
    predictorCorrectorErrorPrevious);
    
  while (!stepDone) {
    predictorCorrectorErrorPrevious = predictorCorrectorError;
    predictorCorrectorError = 0;
    iterations += 1;
    predictorCorrectorError = this.gaussRadauStepthroughInterval(stepTimeStart);
    stepDone = this.checkPredCorrBreaks(iterations, predictorCorrectorError, 
      predictorCorrectorErrorPrevious);
  } 
  
  //console.log("iterations: ",iterations);
  
  // set time to initial value, gets final update later
  //stepTime = stepTimeStart;
  
  // find the next timestep
  dtLast = this.dt;
  
  if (this.epsilon > 0) {
    integratorError = this.getIntegratorError();
    //console.log("integratorError: ",integratorError);
    if (integratorError) {
      dtNew = Math.pow(this.epsilon / integratorError, 1/7) * dtLast;
    } else {
      dtNew = dtLast / this.safetyFactor;
    }
    
    // set floor
    if (dtNew < this.minDt) {
      dtNew = this.minDt;
    }
    
    // set ceiling
    //if (dtNew > this.maxDt) {
    //  console.log("CEILING",dtNew,this.maxDt);
    //  dtNew = this.maxDt;
    //}
    
    if (Math.abs(dtNew / dtLast) < this.safetyFactor) {
    //new timestep is a lot smaller than the last one
      this.copyPosVelToBodies();
      this.dt = dtNew;
      
      if (this.lastSuccessfulDt !== 0) {
        ratio = this.dt / this.lastSuccessfulDt;
        this.predictNextBAndE(ratio);
      }
      //console.log("rejecting ",dtNew, dtLast);
      return 0; //reject the step
    }
    
    if (Math.abs(dtNew / dtLast) > 1) {
      if (dtNew / dtLast > 1 / this.safetyFactor) {
        // limit increase to safety factor
        dtNew = dtLast / this.safetyFactor;
      }
    }
    this.dt = dtNew;
  }
  
  this.finalizePosVel(dtLast);
  
  this.time += dtLast;
  
  this.copyPosVelToBodies();
  
  this.lastSuccessfulDt = dtLast;
  this.updateResetArrays();
  ratio = this.dt / dtLast;
  this.predictNextBAndE(ratio);
  return 1;
};

IntegratorIAS15.prototype.gaussRadauStepthroughInterval = function(stepTimeStart) {
  var tmp,
    gk,
    ak,
    b6ktmp,
    maxak,
    maxb6ktmp,
    predictorCorrectorError,
    stepTime,
    i, k, n; 
  
// step through time interval using Gauss Radau steps
  for (n = 1; n < 8; n += 1) {
   /* s[0] = this.dt * this._hGR[n];
    s[1] = s[0] * s[0] / 2;
    s[2] = s[1] * this._hGR[n] / 3;
    s[3] = s[2] * this._hGR[n] / 2;
    s[4] = 3 * s[3] * this._hGR[n] / 5;
    s[5] = 2 * s[4] * this._hGR[n] / 3;
    s[6] = 5 * s[5] * this._hGR[n] / 7;
    s[7] = 3 * s[6] * this._hGR[n] / 4;
    s[8] = 7 * s[7] * this._hGR[n] / 9;
  
    stepTime = stepTimeStart + s[0];

    // predict body positions to substep n
    for (i = 0; i < this.N; i += 1) {
      for (k = 3*i; k < 3*i + 3; k += 1) {
        xk = this.cspos[k] + (s[8]*this.b[6][k] + s[7]*this.b[5][k] + s[6]*this.b[4][k] + 
          s[5]*this.b[3][k] + s[4]*this.b[2][k] + s[3]*this.b[1][k] + 
          s[2]*this.b[0][k] + s[1]*this.acc0[k] + s[0]*this.vel0[k]);
        
        this.system.bodies[i].pos[k % 3] = this.pos0[k] + xk;
      }
    }*/
    
    // predictGaussRadauPositions returns the stepTime increment
    //stepTime = stepTimeStart + this.predictGaussRadauPositions(n);
    this.predictGaussRadauPositions(n);
  
    // calculate accelerations and copy to acc1
    this.system.calcAccels();
    for (i = 0; i < this.N; i += 1) {
      this.acc1[3*i] = this.system.bodies[i].acc[0];
      this.acc1[3*i + 1] = this.system.bodies[i].acc[1];
      this.acc1[3*i + 2] = this.system.bodies[i].acc[2];
    }
          
    switch (n) {
      case 1:
        for (k = 0; k < this.N3; k += 1) {
          tmp = this.g[0][k];
          gk = this.acc1[k] - this.acc0[k];
          this.g[0][k]  = gk / this._r[0];
          tmp = this.g[0][k] - tmp;
          this.b[0][k] += tmp;
        }
        break;
        
      case 2:
        for (k = 0; k < this.N3; k += 1) {
          tmp = this.g[1][k];
          gk = this.acc1[k] - this.acc0[k];
          this.g[1][k] = (gk/this._r[1] - this.g[0][k])/this._r[2];
          tmp = this.g[1][k] - tmp;
          this.b[0][k] += tmp * this._c[0];
          this.b[1][k] += tmp;
        }
        break;
        
      case 3:
        for (k = 0; k < this.N3; k += 1) {
          tmp = this.g[2][k];
          gk = this.acc1[k] - this.acc0[k];
          this.g[2][k] = ((gk/this._r[3] - this.g[0][k])/this._r[4] - 
            this.g[1][k])/this._r[5];
          tmp = this.g[2][k] - tmp;
          this.b[0][k] += tmp * this._c[1];
          this.b[1][k] += tmp * this._c[2];
          this.b[2][k] += tmp;
        }
        break;
        
      case 4:
        for (k = 0; k < this.N3; k += 1) {
          tmp = this.g[3][k];
          gk = this.acc1[k] - this.acc0[k];
          this.g[3][k] = (((gk/this._r[6] - this.g[0][k])/this._r[7] - 
            this.g[1][k])/this._r[8] - this.g[2][k])/this._r[9];
          tmp = this.g[3][k] - tmp;
          this.b[0][k] += tmp * this._c[3];
          this.b[1][k] += tmp * this._c[4];
          this.b[2][k] += tmp * this._c[5];
          this.b[3][k] += tmp;
        }
        break;
        
      case 5:
        for (k = 0; k < this.N3; k += 1) {
          tmp = this.g[4][k];
          gk = this.acc1[k] - this.acc0[k];
          this.g[4][k] = ((((gk/this._r[10] - this.g[0][k])/this._r[11] - 
            this.g[1][k])/this._r[12] - this.g[2][k])/this._r[13] - 
            this.g[3][k])/this._r[14];
          tmp = this.g[4][k] - tmp;
          this.b[0][k] += tmp * this._c[6];
          this.b[1][k] += tmp * this._c[7];
          this.b[2][k] += tmp * this._c[8];
          this.b[3][k] += tmp * this._c[9];
          this.b[4][k] += tmp;
        }
        break;
        
      case 6:
        for (k = 0; k < this.N3; k += 1) {
          tmp = this.g[5][k];
          gk = this.acc1[k] - this.acc0[k];
          this.g[5][k] = (((((gk/this._r[15] - this.g[0][k])/this._r[16] - 
            this.g[1][k])/this._r[17] - this.g[2][k])/this._r[18] - 
            this.g[3][k])/this._r[19] - this.g[4][k])/this._r[20];
          tmp = this.g[5][k] - tmp;
          this.b[0][k] += tmp * this._c[10];
          this.b[1][k] += tmp * this._c[11];
          this.b[2][k] += tmp * this._c[12];
          this.b[3][k] += tmp * this._c[13];
          this.b[4][k] += tmp * this._c[14];
          this.b[5][k] += tmp;
        }
        break;
        
      case 7:
        maxak = 0;
        maxb6ktmp = 0;
        for (k = 0; k < this.N3; k += 1) {
          tmp = this.g[6][k];
          gk = this.acc1[k] - this.acc0[k];
          this.g[6][k] = ((((((gk/this._r[21] - this.g[0][k])/this._r[22] - 
            this.g[1][k])/this._r[23] - this.g[2][k])/this._r[24] - 
            this.g[3][k])/this._r[25] - this.g[4][k])/this._r[26] - 
            this.g[5][k])/this._r[27];
          tmp = this.g[6][k] - tmp;	
          this.b[0][k] += tmp * this._c[15];
          this.b[1][k] += tmp * this._c[16];
          this.b[2][k] += tmp * this._c[17];
          this.b[3][k] += tmp * this._c[18];
          this.b[4][k] += tmp * this._c[19];
          this.b[5][k] += tmp * this._c[20];
          this.b[6][k] += tmp;
        
          // track the change in b[6][k] to acc1[k]. converged when near 0
          ak = Math.abs(this.acc1[k]);
          if (ak) {
            maxak = Math.max(ak, maxak);
          }
          b6ktmp = Math.abs(tmp); 
          if (b6ktmp) {
            maxb6ktmp = Math.max(b6ktmp, maxb6ktmp);
          }
        }
        
        predictorCorrectorError = maxb6ktmp / maxak;
        break;
    } // end switch(n)   
  } //end for n=1 -> 8 gauss radau stepping
  return predictorCorrectorError;
};


IntegratorIAS15.prototype.predictGaussRadauPositions = function(n) {
  var s = [0, 0, 0, 0, 0, 0, 0, 0],
    xk,
    i, k;
  
  s[0] = this.dt * this._hGR[n];
  s[1] = s[0] * s[0] / 2;
  s[2] = s[1] * this._hGR[n] / 3;
  s[3] = s[2] * this._hGR[n] / 2;
  s[4] = 3 * s[3] * this._hGR[n] / 5;
  s[5] = 2 * s[4] * this._hGR[n] / 3;
  s[6] = 5 * s[5] * this._hGR[n] / 7;
  s[7] = 3 * s[6] * this._hGR[n] / 4;
  s[8] = 7 * s[7] * this._hGR[n] / 9;

  // predict body positions to substep n
  for (i = 0; i < this.N; i += 1) {
    for (k = 3*i; k < 3*i + 3; k += 1) {
      xk = this.cspos[k] + (s[8]*this.b[6][k] + s[7]*this.b[5][k] + s[6]*this.b[4][k] + 
        s[5]*this.b[3][k] + s[4]*this.b[2][k] + s[3]*this.b[1][k] + 
        s[2]*this.b[0][k] + s[1]*this.acc0[k] + s[0]*this.vel0[k]);
      
      this.system.bodies[i].pos[k % 3] = this.pos0[k] + xk;
    }
  }
  return s[0];
};



IntegratorIAS15.prototype.predictNextBAndE = function(ratio) {
  var q1 = ratio,
    q2 = q1 * q1,
    q3 = q1 * q2,
    q4 = q2 * q2,
    q5 = q2 * q3,
    q6 = q3 * q3,
    q7 = q3 * q4,
    k,
    be0,
    be1,
    be2,
    be3,
    be4,
    be5,
    be6;

  for (k = 0; k < this.N3; k += 1) {
    be0 = this.bReset[0][k] - this.eReset[0][k];
    be1 = this.bReset[1][k] - this.eReset[1][k];
    be2 = this.bReset[2][k] - this.eReset[2][k];
    be3 = this.bReset[3][k] - this.eReset[3][k];
    be4 = this.bReset[4][k] - this.eReset[4][k];
    be5 = this.bReset[5][k] - this.eReset[5][k];
    be6 = this.bReset[6][k] - this.eReset[6][k];
    
    this.e[0][k] = q1*(this.bReset[6][k]*7 + this.bReset[5][k]*6 + this.bReset[4][k]*5 + 
      this.bReset[3][k]*4 + this.bReset[2][k]*3 + this.bReset[1][k]*2 + 
      this.bReset[0][k]);
		this.e[1][k] = q2*(this.bReset[6][k]*21 + this.bReset[5][k]*15 + 
		  this.bReset[4][k]*10 + this.bReset[3][k]*6 + this.bReset[2][k]*3 + 
		  this.bReset[1][k]);
		this.e[2][k] = q3*(this.bReset[6][k]*35 + this.bReset[5][k]*20 + 
		  this.bReset[4][k]*10 + this.bReset[3][k]*4 + this.bReset[2][k]);
		this.e[3][k] = q4*(this.bReset[6][k]*35 + this.bReset[5][k]*15 + 
		  this.bReset[4][k]*5 + this.bReset[3][k]);
		this.e[4][k] = q5*(this.bReset[6][k]*21 + this.bReset[5][k]*6 + this.bReset[4][k]);
		this.e[5][k] = q6*(this.bReset[6][k]*7 + this.bReset[5][k]);
		this.e[6][k] = q7* this.bReset[6][k];
   
    this.b[0][k] = this.e[0][k] + be0;
		this.b[1][k] = this.e[1][k] + be1;
		this.b[2][k] = this.e[2][k] + be2;
		this.b[3][k] = this.e[3][k] + be3;
		this.b[4][k] = this.e[4][k] + be4;
		this.b[5][k] = this.e[5][k] + be5;
		this.b[6][k] = this.e[6][k] + be6;
  }
};


IntegratorIAS15.prototype.updateResetArrays = function() {
  this.bReset = this.b.slice(0);  
  this.eReset = this.e.slice(0);
  
  /*for (i = 0; i < 7; i += 1) {
    for (k = 0; k < this.N3; k += 1) {
      this.bReset[i][k] = this.b[i][k];
      this.eReset[i][k] = this.e[i][k];
    }
  }*/
};


IntegratorIAS15.prototype.copyPosVelToBodies = function() {
  var i;
  for (i = 0; i < this.N; i += 1) {
    this.system.bodies[i].pos = this.pos0.slice(3*i, 3*i + 3);
    this.system.bodies[i].vel = this.vel0.slice(3*i, 3*i + 3);
  }
};


IntegratorIAS15.prototype.finalizePosVel = function(dtLast) {
  var dtLast2 = dtLast * dtLast,
    k,
    tmp;
  
  for (k = 0; k < this.N3; k += 1) {
    tmp = this.pos0[k];
    this.cspos[k] += (this.b[6][k]/72 + this.b[5][k]/56 + this.b[4][k]/42 + 
      this.b[3][k]/30 + this.b[2][k]/20 + this.b[1][k]/12 + this.b[0][k]/6 + 
      this.acc0[k]/2) * dtLast2 + this.vel0[k] * dtLast;
    this.pos0[k] = tmp + this.cspos[k];
    this.cspos[k] += tmp - this.pos0[k];
    
    tmp = this.vel0[k];
    this.csvel[k]  += (this.b[6][k]/8 + this.b[5][k]/7 + this.b[4][k]/6 + this.b[3][k]/5 +
      this.b[2][k]/4 + this.b[1][k]/3 + this.b[0][k]/2 + this.acc0[k]) * dtLast;
    this.vel0[k] = tmp + this.csvel[k];
    this.csvel[k] += tmp - this.vel0[k];
  }
};

IntegratorIAS15.prototype.getIntegratorError = function() {
  var integratorError = 0,
    maxak = 0,
    maxb6k = 0,
    ak, b6k,
    i,
    k,
    v2,
    r2;
    
  for (i = 0; i < this.N; i += 1) {
    v2 = 0;
    r2 = 0;
    for (k = 0; k < 3; k += 1) {
      r2 += this.system.bodies[i].pos[k] * this.system.bodies[i].pos[k];
      v2 += this.system.bodies[i].vel[k] * this.system.bodies[i].vel[k];
    }
    
    // if acceleration is slowly changing, skip it
    if (Math.abs(v2 * this.dt * this.dt / r2) > 1e-16) {
      //maxak = Math.max.apply(null, this.acc1.slice(3*i, 3*i + 3).map(Math.abs));
      //maxb6k = Math.max.apply(null, this.b[6].slice(3*i, 3*i + 3).map(Math.abs));
      // above looks nicer, below is way faster
      for (k = 3*i; k < 3*i + 3; k += 1) {
        ak = Math.abs(this.acc1[k]);
        if (ak) {
          maxak = Math.max(ak, maxak);
        }
        b6k = Math.abs(this.b[6][k]); 
        if (b6k) {
          maxb6k = Math.max(b6k, maxb6k);
        }
      }
    }  
  }
 
  integratorError = maxb6k / maxak;
  return integratorError;
};


IntegratorIAS15.prototype.checkPredCorrBreaks = function(iterations, error, errorLast) {
  //console.log("pred corr errs: ",iterations, error, errorLast);
  if (error < 1e-16) {
    return true;
  } else if (iterations > 2 && errorLast <= error) {
    return true;
  } else if (iterations >= 12) {
    return true;
  } else {
    return false;
  }
};


IntegratorIAS15.prototype.copyBodiesToBodiesLast = function() {
  var i;
  for (i = 0; i < this.N; i += 1) {
    this.system.bodiesLast[i].pos = this.system.bodies[i].pos.slice(0);
    this.system.bodiesLast[i].vel = this.system.bodies[i].vel.slice(0);
    this.system.bodiesLast[i].acc = this.system.bodies[i].acc.slice(0);
  }
};


IntegratorIAS15.prototype.copyBodiesToPosVelAcc = function() {
  var i;
  // store initial positions, velocities, accelerations in 1D array
  for (i = 0; i < this.N; i += 1) {
    this.pos0[3*i] = this.system.bodies[i].pos[0];
    this.pos0[3*i + 1] = this.system.bodies[i].pos[1];
    this.pos0[3*i + 2] = this.system.bodies[i].pos[2];
    
    this.vel0[3*i] = this.system.bodies[i].vel[0];
    this.vel0[3*i + 1] = this.system.bodies[i].vel[1];
    this.vel0[3*i + 2] = this.system.bodies[i].vel[2];
    
    this.acc0[3*i] = this.system.bodies[i].acc[0];
    this.acc0[3*i + 1] = this.system.bodies[i].acc[1];
    this.acc0[3*i + 2] = this.system.bodies[i].acc[2];
  }
};  
 
IntegratorIAS15.prototype.setGArray = function() {
  var i; 
  for (i = 0; i < this.N3; i += 1) {
    this.g[0][i] = this.b[6][i]*this._d[15] + this.b[5][i]*this._d[10] + 
      this.b[4][i]*this._d[6] + this.b[3][i]*this._d[3] + this.b[2][i]*this._d[1] + 
        this.b[1][i]*this._d[0] + this.b[0][i];
		this.g[1][i] = this.b[6][i]*this._d[16] + this.b[5][i]*this._d[11] + 
		  this.b[4][i]*this._d[7] + this.b[3][i]*this._d[4] + this.b[2][i]*this._d[2] + 
		  this.b[1][i];
		this.g[2][i] = this.b[6][i]*this._d[17] + this.b[5][i]*this._d[12] + 
		  this.b[4][i]*this._d[8] + this.b[3][i]*this._d[5] + this.b[2][i];
		this.g[3][i] = this.b[6][i]*this._d[18] + this.b[5][i]*this._d[13] + 
		  this.b[4][i]*this._d[9] + this.b[3][i];
		this.g[4][i] = this.b[6][i]*this._d[19] + this.b[5][i]*this._d[14] + this.b[4][i];
		this.g[5][i] = this.b[6][i]*this._d[20] + this.b[5][i];
		this.g[6][i] = this.b[6][i];
  }
};

IntegratorIAS15.prototype.initializeZeroArrays = function() {
  var i, k;
  
  for (i = 0; i < 7; i += 1) {
    for (k = 0; k < this.N3; k += 1) {
      this.b[i][k] = 0;
      this.e[i][k] = 0;
      this.bReset[i][k] = 0;
      this.eReset[i][k] = 0;
    }
  }
};

IntegratorIAS15.prototype.setConstants = function() {
  // Gauss Radau spacings: 8 values
  this._hGR = [0.0, 0.0562625605369221464656521910, 0.1802406917368923649875799428, 
    0.3526247171131696373739077702, 0.5471536263305553830014485577, 
    0.7342101772154105410531523211, 0.8853209468390957680903597629, 
    0.9775206135612875018911745004]; 

  // 28 values
  this._r = [0.0562625605369221464656522, 0.1802406917368923649875799, 
    0.1239781311999702185219278, 0.3526247171131696373739078, 0.2963621565762474909082556, 
    0.1723840253762772723863278, 0.5471536263305553830014486, 0.4908910657936332365357964, 
    0.3669129345936630180138686, 0.1945289092173857456275408, 0.7342101772154105410531523, 
    0.6779476166784883945875001, 0.5539694854785181760655724, 0.3815854601022409036792446, 
    0.1870565508848551580517038, 0.8853209468390957680903598, 0.8290583863021736216247076, 
    0.7050802551022034031027798, 0.5326962297259261307164520, 0.3381673205085403850889112, 
    0.1511107696236852270372074, 0.9775206135612875018911745, 0.9212580530243653554255223, 
    0.7972799218243951369035946, 0.6248958964481178645172667, 0.4303669872307321188897259, 
    0.2433104363458769608380222, 0.0921996667221917338008147];
    
  // 21 values
  this._c = [-0.0562625605369221464656522, 0.0101408028300636299864818, 
    -0.2365032522738145114532321, -0.0035758977292516175949345, 0.0935376952594620658957485, 
    -0.5891279693869841488271399, 0.0019565654099472210769006, -0.0547553868890686864408084, 
    0.4158812000823068616886219, -1.1362815957175395318285885, -0.0014365302363708915610919, 
    0.0421585277212687082291130, -0.3600995965020568162530901, 1.2501507118406910366792415, 
    -1.8704917729329500728817408, 0.0012717903090268677658020, -0.0387603579159067708505249, 
    0.3609622434528459872559689, -1.4668842084004269779203515, 2.9061362593084293206895457, 
    -2.7558127197720458409721005];  
    
  // 21 values
  this._d = [0.0562625605369221464656522, 0.0031654757181708292499905, 
    0.2365032522738145114532321, 0.0001780977692217433881125, 0.0457929855060279188954539, 
    0.5891279693869841488271399, 0.0000100202365223291272096, 0.0084318571535257015445000, 
    0.2535340690545692665214616, 1.1362815957175395318285885, 0.0000005637641639318207610, 
    0.0015297840025004658189490, 0.0978342365324440053653648, 0.8752546646840910912297246, 
    1.8704917729329500728817408, 0.0000000317188154017613665, 0.0002762930909826476593130, 
    0.0360285539837364596003871, 0.5767330002770787313544596, 2.2485887607691598182153473, 
    2.7558127197720458409721005];
};


