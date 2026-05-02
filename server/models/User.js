const mongoose = require('mongoose');

// XP needed to reach each level: level N needs N*150 XP total
function xpForLevel(level) {
  return level * 150;
}

const userSchema = new mongoose.Schema({
  username:    { type: String, required: true, unique: true, trim: true, minlength: 3 },
  email:       { type: String, required: true, unique: true, trim: true, lowercase: true },
  password:    { type: String, required: true },
  avatar:      { type: String, default: '' },
  coins:       { type: Number, default: 0 },
  xp:          { type: Number, default: 0 },
  level:       { type: Number, default: 1 },
  wins:        { type: Number, default: 0 },
  losses:      { type: Number, default: 0 },
  draws:       { type: Number, default: 0 },
  gamesPlayed: { type: Number, default: 0 },
  winStreak:   { type: Number, default: 0 },
  bestStreak:  { type: Number, default: 0 },
  createdAt:   { type: Date, default: Date.now }
});

// Auto level-up when XP changes
userSchema.methods.addXP = function(amount) {
  this.xp += amount;
  let leveled = false;
  while (this.xp >= xpForLevel(this.level)) {
    this.xp -= xpForLevel(this.level);
    this.level += 1;
    this.coins += 5; // bonus 5 coins per level
    leveled = true;
  }
  return leveled; // true if leveled up
};

userSchema.statics.xpForLevel = xpForLevel;

module.exports = mongoose.model('User', userSchema);
