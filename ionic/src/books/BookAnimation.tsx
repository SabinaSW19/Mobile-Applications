import React from 'react'
import { createAnimation, Animation, IonItem } from '@ionic/react';


export function playGroupAnimation(animationsContainer: Animation[]){
    const parentAnimation = createAnimation()
        .duration(100)
        .direction('alternate')
        .iterations(6)
        .addAnimation(animationsContainer);
    parentAnimation.play();
}



export function createShakingAnimation(animatedElem: Element){
    const MAX_TRANSLATE = 10;
    const animation = createAnimation()
        .addElement(animatedElem)
        .fromTo('transform', 'translateX(0)', `translateX(${MAX_TRANSLATE}vw)`)
        .fromTo('color', 'var(--background-color)', 'red');
    return animation;
}
