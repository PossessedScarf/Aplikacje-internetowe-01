<?php

/** @var \App\Model\Vinyl $vinyl */
/** @var \App\Service\Router $router */

$title = "Edit Vinyl {$vinyl->getTitle()} ({$vinyl->getId()})";
$bodyClass = "edit";

ob_start(); ?>
    <h1><?= $title ?></h1>
    <form action="<?= $router->generatePath('vinyl-edit') ?>" method="post" class="edit-form">
        <?php require __DIR__ . DIRECTORY_SEPARATOR . '_form.html.php'; ?>
        <input type="hidden" name="action" value="vinyl-edit">
        <input type="hidden" name="id" value="<?= $vinyl->getId() ?>">
    </form>

    <ul class="action-list">
        <li>
            <a href="<?= $router->generatePath('vinyl-index') ?>">Back to list</a></li>
        <li>
            <form action="<?= $router->generatePath('vinyl-delete') ?>" method="post">
                <input type="submit" value="Delete" onclick="return confirm('Are you sure?')">
                <input type="hidden" name="action" value="vinyl-delete">
                <input type="hidden" name="id" value="<?= $vinyl->getId() ?>">
            </form>
        </li>
    </ul>

<?php $main = ob_get_clean();

include __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'base.html.php';
