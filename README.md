# WALK ALL PROPERTIES DEEP IN OBJECT AND CHANGE VALUES

With this library you will go deep through all 
properties in your javascript object with
nice possibility to change their values
without confusion.

In this library there are 2 basic functions:

**walk.Object( myJSObject, iteratorFunction )**

and 

**walk.ObjectBy( myObjectPropert, contextObject  , iteratorFunction )**

There are both similar... the difference is 
that, with second function you main object 
is also included in iteration and can be changed.

# Example

```ts

import { walk } from 'lodash-walk-object'

let = yourJSObject = {
  isGood: true,
  arr = [ 
    {  insideObjectValue: 1 } 
    {  insideObjectValue: 1 } 
  ],
  testObject: {}
}

walk.Object(yourJSObject, (value, lodashPath, changeValue) => {
  if(lodashPath === 'arr[0].insideObjectValue') {
    changeValue(2)
  }
} )

console.log(yourJSObject)

// RESULT

/*
{
  isGood: true,
  arr = [ 
    {  insideObjectValue: 2 } 
    {  insideObjectValue: 1 } 
  ],
  testObject: {}
}
*/

```

