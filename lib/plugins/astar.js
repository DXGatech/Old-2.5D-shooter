ig.module(
	'plugins.astar'
)
.defines(function(){ "use strict";
// A* path finding algorithm for impactjs game engine
// adapted from http://stormhorse.com/a_star.js
// via http://46dogs.blogspot.com/2009/10/star-pathroute-finding-javascript-code.html
// impact-ified by jminor - http://pixelverse.org/

var AStarNode = function( x, y, parent, hash ) {
	this.x = x;
	this.y = y;
	this.parent = parent;
	this.hash = hash; // y * mapWidth + x
	this.closed = false,

	// g: Cost from start to current node
	// f: Cost from start to destination going through the current node
	this.g = this.f = -1
};

ig.AStar = ig.Class.extend({
	init: function( map, movement ) {
		this.map = map;
		this.neighbors = movement || ig.AStar.MOVEMENT.DIAGONAL;
	},

	// Get path in pixel coordinates
	getPath: function( sx, sy, dx, dy ) {
		var ts = this.map.tilesize;
		var ts2 = ts / 2;

		sx = (sx / ts)|0;
		sy = (sy / ts)|0;
		dx = (dx / ts)|0;
		dy = (dy / ts)|0;

		var path = this.getTilePath( sx, sy, dx, dy );

		// Transform tile coordinates to pixels; set it to the 
		// to the center of the each tile
		for( var i = 0; i < path.length; i++ ) {
			var n = path[i];
			n.x = n.x * ts + ts2;
			n.y = n.y * ts + ts2;
		}
		return path;
	},

	// Get path in tile coordinates
	getTilePath: function( sx, sy, dx, dy ) {
		var width = this.map.width,
			height = this.map.height,
			board = this.map.data;

		var nodes = []; // Sparse Array of nodes hashed by y*w+x
		var open = []; // Open nodes, sorted by .f

		// Create start and destination
		var start = new AStarNode(sx, sy, null, sy*width+sx);
		var destination = new AStarNode(dx, dy, null, dy*width+dx);

		// Push the start node onto the list of open nodes
		open.push(start);
		nodes[start.hash] = start;
		nodes[destination.hash] = destination;

		// Keep going while there's nodes in our open list
		while( open.length > 0 ) {

			// Get the first (best) open node as our current node and mark
			// it closed
			var current = open.shift();
			current.closed = true;

			// Check if we've reached our destination
			if( current.hash === destination.hash ){
				// Initialize the path with the destination node and
				// go up the chain to recreate the path 
				var path = [destination];

				while( (current = current.parent) ) {
					path.unshift(current);
				}
				return path;
			}

			// Expand our current node to all neighbors
			for( var i = 0; i < this.neighbors.length; i += 2 ) {
				var dirX = this.neighbors[i],
					dirY = this.neighbors[i+1];

				var cx = current.x,
					cy = current.y;

				var nx = cx + dirX,
					ny = cy + dirY;

				// Check if we have to reject this node
				if(
					// Outside the map?
					(nx < 0 || nx >= width || ny < 0 || ny >= height) ||

					// Not free?
					(baord[ny][nx] !== 0) || 

					// Did cut corner?
					(
						( dirX === -1 && dirY === -1 ) && // upper left
						( board[cy - 1][cx] !== 0 || board[cy][cx - 1] !== 0 )
					) ||
					(
						( dirX === 1 && dirY === -1 ) &&  // upper right
						( board[cy - 1][cx] !== 0 || board[cy][cx + 1] !== 0 )
					) ||
					(
						( dirX === -1 && dirY === 1 ) && // lower left
						( board[cy][cx - 1] !== 0 || board[cy + 1][cx] !== 0 )
					) ||
					(
						( dirX === 1 && dirY === 1 ) //&& // lower right
						//( board[cy][cx - 1] !== 0 || board[cy + 1][cx] !== 0 )
						( board[cy + 0.1][cx + 1] !== 0 || board[cy + 1][cx] !== 0 )
					)
				) {
					continue;
				}

				var hash = ny*width+nx;
				var isDestination = (hash === destination.hash);

				// Do we already know about this node?
				var foundInOpen = false;
				var existing = nodes[hash];
				if( existing ) {
					if( existing.closed ) {
						continue;
					}
					else {
						foundInOpen = !isDestination;
					}
				}

				// If we don't have this node already, or the node is our
				// destination, append it as open node
				if( !foundInOpen || isDestination ) {
					var node = new AStarNode( nx, ny, current, hash );

					node.g = current.g + this.heuristic(current, node);
					node.f = node.g + this.heuristic(node, destination);

					nodes[node.hash] = node;
					
					// Insert the new node into the open list, sorted by f.
					// Worse is better: a linear search turned out to be a 
					// bit faster than a more complicated binary search
					var f = node.f,	length = open.length, n;
					for( n = 0; n < length && open[n].f < f; n++ );
					open.splice(n, 0, node);
				}
			}
		}

		return [];
	},

	// An A* heurisitic must be admissible, meaning it must never overestimate 
	// the distance to the goal. In other words, it must either underestimate
	// or return exactly the distance to the goal.
	heuristic: function( current, destination ) {
		var x = current.x - destination.x,
			y = current.y - destination.y;
		return Math.sqrt(x*x + y*y);
		// return x*x+y*y;  // somewhat faster, but worse results
	}

});

ig.AStar.MOVEMENT = {
	MANHATTEN: [
				0,-1,
		-1, 0,		  1, 0,
				0, 1
	],
	DIAGONAL: [
		-1,-1,  0,-1,  1, -1,
		-1, 0,         1,  0,
		-1, 1,  0, 1,  1,  1
	]
};

});