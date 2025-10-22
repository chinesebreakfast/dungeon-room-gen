// enemies/enemy.js
import { ENEMY_TYPES } from './enemyTypes.js';

export class Enemy {
  constructor(type, x, z, room, navigation) {
    this.id = `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.type = type;
    this.config = ENEMY_TYPES[type];
    this.x = x;
    this.z = z;
    this.room = room;
    this.navigation = navigation;
    
    this.targetCell = null;
    this.availableMoves = [];
    
    // состояния и анимации
    this.state = 'PATROL'; // Сразу начинаем с PATROL
    this.currentAnimation = null;
    this.animationGroups = null;

    // таймеры для смены состояний
    this.stateTimer = 0;
    
    // Сразу выбираем целевую клетку при создании
    this.chooseNextCell();
  }

  update(deltaTime){
    // Пока ничего не обновляем - просто держим состояние PATROL
  }

  setState(newState){
    if(this.state === newState) return;

    this.state = newState;
    this.stateTimer = 0;

    this.playStateAnimation(newState);
  }

  chooseNextCell(){
    this.availableMoves = this.navigation.getWalkableNeighbors(this.x, this.z);

    if(this.availableMoves.length > 0){
      const randomIndex = Math.floor(Math.random() * this.availableMoves.length);
      this.targetCell = this.availableMoves[randomIndex];
      console.log(`🎯 ${this.type} at (${this.x},${this.z}) → Target: (${this.targetCell.x},${this.targetCell.z})`);
    } else {
      this.targetCell = null;
      console.log(`❌ ${this.type} at (${this.x},${this.z}) - No available moves`);
    }
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

  getAIDebugInfo() {
    return {
      state: this.state,
      currentPos: {x: this.x, z: this.z},
      targetCell: this.targetCell,
      availableMoves: this.availableMoves
    };
  }
}