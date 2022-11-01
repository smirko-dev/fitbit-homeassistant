/**
 * @module Entity
 * @brief Provides container for HA entities
 */


/**
 * Create Entity class object
 * @param {string} id - Entity ID
 * @param {string} name - Entity name
 * @param {string] state - Entity state
 */
export function Entity(id, name, state) {
    this.id = id;
    this.name = name;
    this.state = state;
}

/**
 * Entity validity
 * @return True if the entity has a valid id and a valid state
 */
Entity.prototype.isValid = function() {
    let self = this;
    return self.id !== undefined && self.id !== "" && self.state !== undefined && self.state !== "";
}

/**
 * Create Entities class object
 */
export function Entities() {
    this.list = [];
}

/**
 * Clear entity list
 */
Entities.prototype.clear = function() {
    let self = this;
    self.list = [];
}

/**
 * Add new entity
 * @param {string} id - Entity id
 * @param {string} name - Entity name
 * @param {string} state - Entity state
 */
Entities.prototype.add = function(id, name, state) {
    let self = this;
    if (self.findById(id) === -1) {
        let entity = new Entity(id, name, state);
        if (entity.isValid()) {
            self.list.push(entity);
        }
    }
}

/**
 * Remove entity
 * @param {string} id - Entity id
 */
Entities.prototype.remove = function(id) {
    let self = this;
    let index = self.findById(id);
    if (index !== -1) {
        self.list.splice(index, 1);
    }
}

/**
 * Find entity by its id
 * @param {string} id - Entity id
 * @return Entity index or -1 if entity wasn't found
 */
Entities.prototype.findById = function(id) {
    let self = this;
    self.list.forEach((entity, index) => {
        if (entity.id === id) {
            return index;
        }
    })
    return -1;
}

/**
 * Find entity by its name
 * @param {string} name - Entity name
 * @return Entity index or -1 if entity wasn't found
 */
Entities.prototype.findByName = function(name) {
    let self = this;
    self.list.forEach((entity, index) => {
        if (entity.name === name) {
            return index;
        }
    })
    return -1;
}

/**
 * Set state of an entity
 * @param {string} id - Entity id
 * @param {string} state - Entity state
 */
Entities.prototype.set = function(id, state) {
    let self = this;
    let index = self.findById(id);
    if (index !== -1) {
        self.list[index].state = state;
    }
}

/**
 * Sort entities by ids
 */
Entities.prototype.sort = function() {
    let self = this;
    self.list.sort(function(entityA, entityB) {
        let idA = entityA.id.toUpperCase();
        let idB = entityB.id.toUpperCase();
        if (idA < idB) {
            return -1;
        }
        else if (idA > idB) {
            return 1;
        }
        return 0;
    })
}
