<?php

/** @var $vinyl ?\App\Model\Vinyl */
/** @var \App\Service\Router $router */

$title = 'Create Vinyl';
$bodyClass = "edit";

ob_start(); ?>
    <h1>Create Vinyl</h1>
    <form action="<?= $router->generatePath('vinyl-create') ?>" method="post" class="edit-form">
        <?php require __DIR__ . DIRECTORY_SEPARATOR . '_form.html.php'; ?>
        <input type="hidden" name="action" value="vinyl-create">
    </form>

    <a href="<?= $router->generatePath('vinyl-index') ?>">Back to list</a>
<?php $main = ob_get_clean();

include __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'base.html.php';
