# WALK ALL PROPERTIES DEEP IN OBJECT AND CHANGE VALUES

With this library you will got through all 
properties in your javascript object with
nice possibility to change their values
without confusion.

There are 2 basic functions:

**walk.Object( myJSObject, iteratorFunction )**

and 

**walk.ObjectBy( myObjectPropert, contextObject  , iteratorFunction )**

There are both similar... ther difference is 
that with second function you main object 
is also included in iteration and can be changed.

# Example

```ts

import { walk } from 'lodash-walk-object'

let = yourJSObject = {
  isGood: true,
  arr = [ 
    {  insideOjectValue: 1 } 
    {  insideOjectValue: 1 } 
  ],
  testObject: {}
}

walk.Object(yourJSObject, (value, lodashPath, changeValue) => {
  if(lodashPath === 'arr[0].insideOjectValue') {
    changeValue(2)
  }
} )

console.log(yourJSObject)

// RESULT

/*
{
  isGood: true,
  arr = [ 
    {  insideOjectValue: 2 } 
    {  insideOjectValue: 1 } 
  ],
  testObject: {}
}
*/

```

