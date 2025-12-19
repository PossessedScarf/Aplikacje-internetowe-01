<?php
/** @var $vinyl ?\App\Model\Vinyl */
?>

<div class="form-group">
    <label for="title">Title</label>
    <input type="text" id="title" name="vinyl[title]" value="<?= $vinyl ? $vinyl->getTitle() : '' ?>">
</div>

<div class="form-group">
    <label for="description">Description</label>
    <textarea id="description" name="vinyl[description]"><?= $vinyl? $vinyl->getDescription() : '' ?></textarea>
</div>

<div class="form-group">
    <label for="price">Price</label>
    <input type="text" id="price" name="vinyl[price]" value="<?= $vinyl ? $vinyl->getPrice() : '' ?>">
</div>

<div class="form-group">
    <label></label>
    <input type="submit" value="Submit">
</div>