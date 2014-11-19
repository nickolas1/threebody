/*jshint quotmark: double, unused: false  */
"use strict";
/*global Body*/

function PlanetCluster(N) {
    this.N = N;
    var masses = this.generateMasses(),
        pos = this.generatePositions(),
        vel = this.generateVelocities(),
        statevec;
    
    this.stars = Array.apply(null, new Array(N)).map(Number.prototype.valueOf,0);
  
    // get stars set up
    this.stars.forEach(function (v, i, a) {
        a[i] = new Body(i, masses[i], pos[i], vel[i], [0, 0, 0]);
    });  
    
    // get planet bases
    statevec = this.generatePlanetStateVec();
    this.setupPlanets(statevec, this.stars);
}

PlanetCluster.prototype.generateMasses = function() {
    // power law mass function from 1 to 10, alpha = -2.3
    var alpha = 2.3,
        mhi = 10.0,
        mlo = 1.0;
    var alpham1 = alpha - 1,
        fm1 = 1.0 / Math.pow(mhi, alpham1),
        fmn = (fm1 - 1.0 / Math.pow(mlo, alpham1)) / (this.N / 4 - 1),
        constant = 1.0 / alpham1;
    var mass,
        mtot = 0.0,
        fmi;  
    var masses = Array.apply(null, new Array(this.N)).map(Number.prototype.valueOf,0);

    masses.forEach(function (v, i) {
        if (i < this.N / 4) {
            fmi = fm1 - i * fmn;
            masses[i] = 1.0 / Math.pow(fmi, constant);
        }
        else {
            masses[i] = 0.001;
        }
        mtot += masses[i];
    }.bind(this));
    
    masses.forEach(function (v, i) {
      masses[i] /= mtot;   
    });      
   
    return masses;     
};

PlanetCluster.prototype.generatePositions = function() {
    // plummer sphere!
    var positions = Array.apply(null, new Array(this.N)).map(Number.prototype.valueOf,0);  
    var ri, a1, a2, posx, posy, posz;
    var posbase = [[1.2, 0.9, 30], [-0.9, -1, 20], [-1.2, 0.8, 0], [1, -0.8, -20]],
        scale = 0.3;

    positions.forEach(function (v, i) {
        if (i < this.N / 4) {
            a1 = Math.random();
            a2 = Math.random();
            positions[i] = [posbase[i][0] + (0.5 - a1) * scale, posbase[i][1] + (0.5 - a2) * scale, posbase[i][2]];
        }
    }.bind(this));
    
    return positions;     
};       

PlanetCluster.prototype.generateVelocities = function() {
    // plummer sphere!
    var velocities = Array.apply(null, new Array(this.N)).map(Number.prototype.valueOf,0);
    var velbase = [[0.1, -0.3, 0], [-0.4, 0.3, 0], [0.5,0.2, 0], [-0.2, -0.2, 0]],
        scale = 0.05;
    
    velocities.forEach(function (v, i) {        
        if (i < this.N / 4) {
            velocities[i] = [velbase[i][0]*scale, velbase[i][1]*scale, velbase[i][2]*scale];
        }
    }.bind(this));
       
    return velocities;
};

PlanetCluster.prototype.generatePlanetStateVec = function() {
    var i,
        count = 0,
        parent = 0,
        semis,
        incbase,
        inc,
        ecc,
        O,  // long of ascending node
        w,  // arg of periapsis
        M,  // mean anomoly
        statevec = [], // cartesian components
        semiscale = [0.4, 0.3, 0.25, 0.2];

    for(i = this.N / 4; i < this.N; i = i + 1) {
        if (count === 0) {
            incbase = Math.PI * (115 - 12 * Math.random()) / 180;
            semis = [1 + 0.1 * (0.5 - Math.random()),
                    1.5 + 0.1 * (0.5 - Math.random()),
                    2.1 + 0.1 * (0.5 - Math.random())];
            O = 2 * Math.PI * Math.random();
        }

        inc = incbase + Math.PI * (0.5 - Math.random()) / 180;
        ecc = 0.1 * Math.random();
   
        w = 2 * Math.PI * Math.random();
        M = 2 * Math.PI * Math.random();

        statevec.push(this.kepToCart(semis[count] * semiscale[parent], ecc, inc, O, w, M, this.stars[i].mass + this.stars[parent].mass));
        
        count++;
        if (count === 3) {
            count = 0;
            parent++;
        }
    }

    return statevec;
};

PlanetCluster.prototype.setupPlanets = function(statevec, stars) {
    var i,
        istate,
        count = 0,
        parent = 0;
    for (i = this.N / 4; i < this.N; i = i + 1) {
        istate = i - this.N / 4;
        stars[i].pos = [stars[parent].pos[0] + statevec[istate][0],
            stars[parent].pos[1] + statevec[istate][1],
            stars[parent].pos[2] + statevec[istate][2]];
        
        stars[i].vel = [stars[parent].vel[0] + statevec[istate][3],
            stars[parent].vel[1] + statevec[istate][4],
            stars[parent].vel[2] + statevec[istate][5]];
        /*stars[i].vel[0] = statevec[istate][3];
        stars[i].vel[1] = statevec[istate][4];
        stars[i].vel[2] = statevec[istate][5];*/
        
        count++;
        if (count === 3) {
            count = 0;
            parent++;
        }
    }
};

PlanetCluster.prototype.eccentricAnomoly = function(M, e) {
    var E0 = M,
        eps = 1.e-10,
        E1 = E0 - (E0 - e * Math.sin(E0) - M) / (1 - e * Math.cos(E0));
    while ( Math.abs(E1 - E0) > eps ) {
        E0 = E1;
        E1 = E0 - (E0 - e * Math.sin(E0) - M) / (1 - e * Math.cos(E0));
    }
    return E1;
};


PlanetCluster.prototype.kepToCart = function(a, e, i, O, w, M, mu) {
    var E = this.eccentricAnomoly(M, e);
    var Px = Math.cos(w) * Math.cos(O) - Math.sin(w) * Math.cos(i) * Math.sin(O),
        Py = Math.cos(w) * Math.sin(O) + Math.sin(w) * Math.cos(i) * Math.cos(O),
        Pz = Math.sin(w) * Math.sin(i);
    var Qx = -Math.sin(w) * Math.cos(O) - Math.cos(w) * Math.cos(i) * Math.sin(O),
        Qy = -Math.sin(w) * Math.sin(O) + Math.cos(w) * Math.cos(i) * Math.cos(O),
        Qz = Math.cos(w) * Math.sin(i);
    var coeff1 = a * (Math.cos(E) - e),
        coeff2 = a * Math.sqrt(1 - e*e) * Math.sin(E),
        coeff3 = Math.sqrt(mu / (a*a*a)) / (1 - e * Math.cos(E)),
        coeff4 = -a * Math.sin(E),
        coeff5 = a * Math.sqrt(1 - e*e) * Math.cos(E);
    var statevec = [
        coeff1 * Px + coeff2 * Qx,
        coeff1 * Py + coeff2 * Qy,
        coeff1 * Pz + coeff2 * Qz,
        coeff3 * (coeff4 * Px + coeff5 * Qx),
        coeff3 * (coeff4 * Py + coeff5 * Qy),
        coeff3 * (coeff4 * Pz + coeff5 * Qz)
    ];
    return statevec;
};


