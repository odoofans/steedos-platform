var util = require("../util");

import {ObjectSchema} from "./ObjectSchema";
import {ObjectSchemaOptions} from "./ObjectSchemaOptions";

import { JsonMap, getString } from '@salesforce/ts-types';
import { Validators } from '../validator';

declare var Creator: any;

/**
 * ConnectionManager is used to store and manage multiple orm connections.
 * It also provides useful factory methods to simplify connection creation.
 */
export class ObjectSchemaManager {

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * List of connections registered in this connection manager.
     */
    public readonly objectSchemas: ObjectSchema[] = [];

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    
    /**
     * Checks if connection with the given name exist in the manager.
     */
    has(name: string): boolean {
        return !!this.objectSchemas.find(object => object.name === name);
    }

    /**
     * Gets registered connection with the given name.
     * If connection name is not given then it will get a default connection.
     * Throws error if connection with the given name was not found.
     */
    get(name: string = "default"): ObjectSchema {
        const connection = this.objectSchemas.find(object => object.name === name);
        if (!connection)
            throw new Error(name);

        return connection;
    };

    /**
     * Creates a new connection based on the given connection options and registers it in the manager.
     * Connection won't be established, you'll need to manually call connect method to establish connection.
     */
    create(options: ObjectSchemaOptions): ObjectSchema {

        this.validate(options);

        // check if such connection is already registered
        const existSchema = this.objectSchemas.find(objectSchema => objectSchema.name === (options.name || "default"));
        if (existSchema) {
            // if its registered but closed then simply remove it from the manager
            if (!options.extend)
                throw new Error("Object schema exists, do you want to extend?");
        }

        // create a new objectSchema
        const objectSchema = new ObjectSchema(options);
        this.objectSchemas.push(objectSchema);

        this.registerCreator(options);

        return objectSchema;
    }

    createFromFile(filePath: string):ObjectSchema {
        let json: ObjectSchemaOptions = util.loadFile(filePath);
        return this.create(json);
    };

    registerCreator(json: JsonMap) {
        let _id = getString(json, "_id") || getString(json, "name");
        if (_id) {
            if ((typeof Creator !== "undefined") && Creator.Objects) {
                Creator.Objects[_id] = json;
                if (typeof Creator.fiberLoadObjects == 'function') {
                    Creator.fiberLoadObjects(json);
                }
            }
        }
    };
    
    validate(options: ObjectSchemaOptions): boolean {
        return Validators.steedosObjectSchema(options);
    };

    remove(name: string) {
        const existSchema = this.objectSchemas.find(objectSchema => objectSchema.name === name);
        if (existSchema) {
            // if its registered but closed then simply remove it from the manager
            this.objectSchemas.splice(this.objectSchemas.indexOf(existSchema), 1);
        }
    }

}