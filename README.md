# WALK ALL PROPERTIES DEEP IN OBJECT AND CHANGE VALUES

This library let you go deep through all 
properties in your javascript object with
nice possibility to change theirs values
without confusion.

# WALK OBJECT

**walk.Object( myJSObject, iteratorFunction )**

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

