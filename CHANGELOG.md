# Rurik Changelog

## 2024-10-13 - v0.5.3.1 - bug fixes
* Bug fixes for accomplishing deeds (mStatement, currentPlayer)


## 2024-10-03 - v0.5.3.0 - undo action
* Undo actions for a turn.
* Fix bug with game log.


## 2024-09-28 - v0.5.2.2 - minor enhancements
* Show leader name and description in other player Boat and Supply view.

## 2024-09-28 - v0.5.2.1 - bug fixes mostly caused by leader changes
* Fix accomplish deedCardToVerify is not defined.
* Should not show leader action choices for other players.
* Claim board doesn't score+show correct rule points.
* Scheme first player did not pick new first player.
* Troop converted by church did not return troop to supply.
* Put-action hack did not work.
* AI forfeited attack action but still attacked.
* Set coin bid back to 0 after placing advisor.
* Reduce flicker and flashing on Claim board.

## 2024-09-01 - v0.5.2.0 - leader special abilities
* add leader special abilities - 4 of 11
* remove unused code

## 2024-08-28 - v0.5.1.6 - AI improvements
* AI can complete some more deed cards - 24 of 32

## 2024-08-27 - v0.5.1.5 - AI improvements
* AI can complete some more deed cards - 18 of 32
* bug: warfare track goes beyond 10.

## 2024-08-25 - v0.5.1.4 - Bug fixes
* Fix case at end of round where AI would not progress the game.
* Don't allow deed cards to be accomplished more than once.

## 2024-08-25 - v0.5.1.3 - AI improvements
* AI can complete some deed cards - 12 of 32
* bug: Clear the Game Log with "Leave Game"

## 2024-08-24 - v0.5.1.2 - package binary.
* Added code to package binary.
* Fix file permissions on assets.
* Refactored server.js.

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
