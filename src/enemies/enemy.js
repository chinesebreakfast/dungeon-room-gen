// enemies/enemy.js
import { ENEMY_TYPES } from './enemyTypes.js';

export class Enemy {
  constructor(type, x, z, room) {
    this.id = `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.type = type;
    this.config = ENEMY_TYPES[type];
    this.x = x;
    this.z = z;
    this.room = room;
    
    //состояния и анимации
    this.state = 'IDLE';
    this.currentAnimation = null;
    this.animationGroups = null;

    //таймеры для смены состояний
    this.stateTimer = 0;
    this.idleDuration = this.getRandomIdleDuration();
  }

update(deltaTime){
    this.updateStateTimer(deltaTime);

    switch(this.state){
        case 'IDLE':
            this.updateIdleState();
            break;
    }
}

updateStateTimer(deltaTime){
    this.stateTimer += deltaTime;
}

updateIdleState(){
    if(this.stateTimer >= this.idleDuration){
        //всегда остаемся в IDLE для текущей версии
        this.resetIdleTimer();
    }
}

resetIdleTimer(){
    this.stateTimer = 0;
    this.idleDuration = this.getRandomIdleDuration();
}

getRandomIdleDuration() {
    return 3 + Math.random() * 5;
}

setState(newState){
    if(this.state === newState) return;

    this.state = newState;
    this.stateTimer = 0;

    this.playStateAnimation(newState);
}

playStateAnimation(state){
    const animationName = this.config.animations[state];
    if(animationName && this.animationGroups){
        this.stopAllAnimations();

        const animationGroup = this.animationGroups.find(
            group => group.name === animationName);
        if(animationGroup){
            animationGroup.start(true);
            this.currentAnimation = animationGroup;
        } else {
        console.warn(`⚠️ Animation not found: ${animationName} for ${this.type}`);
      }
    }
}

stopAllAnimations(){
    if(this.animationGroups){
        this.animationGroups.forEach(group => group.stop());
        this.currentAnimation = null;
    }
}
// Установка анимационных групп после загрузки модели (для рендера)
setAnimationGroups(animationGroups){
    this.animationGroups = animationGroups;
    this.playStateAnimation(this.state);
}

  // Метод для получения данных для рендеринга
getRenderData() {
    return {
      id: this.id,
      type: this.type,
      x: this.x,
      z: this.z,
      config: this.config,
      state: this.state
    };
}

  // Получение позиции
getPosition() {
    return { x: this.x, z: this.z };
}
}