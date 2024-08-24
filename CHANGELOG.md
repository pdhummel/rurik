# Rurik Changelog

## 2024-08-24 - v0.5.1.1 - fix scheme bug.
* Fixed scheme bug where scheme deck selection was not displaying.
* Added Leave Game button.
* Added hack to set the currentState.
* Added more integration test code.

## 2024-08-17 - v0.5.1.0 - game setup enhancements.
* Table/game setup
  * game creator - 
    * only creator can start game
    * only creator can assign first player
  * join from list

## 2024-08-13 - v0.5.0.3 - secret agenda scoring.
* end game secret agenda evaluation
* ai scheme

## 2024-08-11 - v0.5.0.2 - player view enhancements.
* other players view
  * show scheme card count for others
  * show completed deed cards for others
* get rewards for accomplishing deeds

## 2024-08-10 - v0.5.0.1 - player view enhancements.
* player view
  * show leader in supply  
  * show victory point tokens

* other players view
  * show player boat, dock, supply
  * show victory point tokens for others

## 2024-08-10 - v0.5 - Initial Release
* refresh every 10 seconds
* show compass for player position
* bug - leader dropdown has repeat entries
* ability to rejoin from game list
* only rejoin game for valid colors
* strategy phase - auction boards
* show coins on advisor bid
* validation - coins for auction bid
* validation -- multiple advisors same color, same column
* fix troop coordinates on map
* add more leaders
* retrieve advisor from auction board
* show buildings on map
* dockerize
* muster action
* move action
* attack action
* tax action
* build action
* define scheme cards
* move goods between dock and boat
* advance war track after attack
* show scheme cards for self
* pick scheme cards
* add templating to split html into multiple files
* play scheme card
* create deed cards
* show captured rebel armies
* show conversion tokens
* first player bear token
* scheme card reward - take deedCard
* show deed cards for self
* bug: fix docker after code refactoring
* show secret agenda
* scheme cards with "Or" rewards
* use conversion token
* build action - church
* show round indicator on map board
* create claim board
* display war track with claim board
* window for claim board and war track
* display war track bonuses
* make assertions for accomplishing a deed
* verify assertions for accomplishing a deed
* indicate accomplished deed cards
* end game logic and scoring
* show error messages in UI
* end round - coins from boat
* end round - coin compensation from claim board and war tracks
* handle leader defeated and leader muster
* hack api -- add/subtract money
* hack api -- add/remove troop from anywhere
* hack api -- add actions for muster, move, tax, build, attack
* hack api -- add resource to dock
* playAdvisor - check for 2 advisors from the same player in the same column
* AI strategy phase logic -- based on solo
* Add AI to game creation/setup views
* AI action phase logic
* bug - "Return Scheme Card to Deck" -- no cards in dropdown
* bug - retrieveAdvisor() - TypeError: Cannot read property '0' of undefined
* bug: claim track does not clear lower values.
* bug: did not earn boon token when honey column filled
* bug: Move leader instead of troops - "from" location.
* game log
* fix screen to adapt to larger screens that are more than 1024px wide
* ability to delete game from UI
